import fs from 'fs'
import path from 'path'
import util from 'util';
import deipRpc from '@deip/deip-rpc-client';
import filesService from './../services/fileRef';
import sharedFilesService from '../services/sharedFiles';
import subscriptionsService from './../services/subscriptions';
import ripemd160 from 'crypto-js/ripemd160';
import pdf from 'html-pdf';
import moment from 'moment';
import archiver from 'archiver';
import notifier from './../services/notifications';
import usersService from './../services/users';
import { authorizeResearchGroup } from './../services/auth'
import config from './../config';

const { sharedFileStatus } = require('./../common/enums');

const listFileRefs = async (ctx) => {
  const projectId = ctx.params.projectId;
  try {
    const refs = await filesService.findFileRefByProject(projectId);
    ctx.status = 200;
    ctx.body = refs;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getFileRefById = async (ctx) => {
  const refId = ctx.params.refId;
  try {
    const ref = await filesService.findFileRefById(refId);
    ctx.status = 200;
    ctx.body = ref;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getFileRefByHash = async (ctx) => {
  const hash = ctx.params.hash;
  const projectId = ctx.params.projectId;
  try {
    const ref = await filesService.findFileRefByHash(projectId, hash);
    ctx.status = 200;
    ctx.body = ref;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const CERTIFICATE_BASE_PATH = './data/certificates/file_registered';
const getContentCertificateHtml = async ({
  researchId, ownerUsername, researchGroupId,
  contentId, contentHash
}) => {
  const [ownerProfile, [ownerAccount]] = await Promise.all([
    usersService.findUserById(ownerUsername),
    deipRpc.api.getAccountsAsync([ownerUsername])
  ]);
  const ownerName = ownerProfile.firstName && ownerProfile.lastName ? `${ownerProfile.firstName} ${ownerProfile.lastName}` : ownerUsername;
  const ownerPubKey = ownerAccount.owner.key_auths[0][0];

  const fileHist = await deipRpc.api.getContentHistoryByResearchAndHashAsync(researchId, contentHash);
  const headBlock = await deipRpc.api.getBlockAsync(fileHist.block);

  const readFileAsync = util.promisify(fs.readFile);
  const rawHtml = await readFileAsync(`${CERTIFICATE_BASE_PATH}/index.html`, 'utf8');

  const certificateId = ripemd160(`${researchGroupId}-${researchId}-${contentId}-${contentHash}`).toString();

  return rawHtml
    .replace(/{{certificate_id}}/, certificateId)
    .replace(/{{project_id}}/, researchId)
    .replace(/{{owner_name}}/, ownerName)
    .replace(/{{registration_date}}/, moment(fileHist.timestamp).format("MMM DD, YYYY"))
    .replace(/{{registration_time}}/, moment(fileHist.timestamp).format("HH:mm:ss"))
    .replace(/{{file_hash}}/, contentHash)
    .replace(/{{tx_hash}}/, fileHist.trx_id)
    .replace(/{{block_number}}/, fileHist.block)
    .replace(/{{block_hash}}/, headBlock.block_id)
    .replace(/{{ip_owner_public_key}}/, ownerPubKey)
    .replace(/{{chain_id}}/, config.blockchain.chainId)
};

const exportCertificates = async (ctx) => {
  try {
    const jwtUsername = ctx.state.user.username;
    const researchId = ctx.params.projectId;
    const contentHashes = Array.isArray(ctx.request.query.contentHashes)
      ? ctx.request.query.contentHashes
      : [ctx.request.query.contentHashes]

    const [research, researchContents] = await Promise.all([
      deipRpc.api.getResearchByIdAsync(researchId),
      deipRpc.api.getAllResearchContentAsync(researchId),
    ]);

    if (!contentHashes.length) {
      ctx.status = 400;
      ctx.body = 'Content hashes are required';
      return;
    }

    const certificatesData = [];
    for (const contentHash of contentHashes) {
      const content = researchContents.find(c => c.content === contentHash);
      if (!content) {
        ctx.status = 400;
        ctx.body = `File with hash ${contentHash} is not found`;
        return;
      }
      const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(research.research_group_id);
      const userRgt = rgtList.find(rgt => rgt.owner === jwtUsername);
      if (!userRgt) {
        ctx.status = 403;
        ctx.body = `"${jwtUsername}" is not permitted to get certificates for "${research.id}" project`;
        return;
      }
      const maxRgt = rgtList.reduce(
        (max, rgt) => (rgt.amount > max ? rgt.amount : max),
        rgtList[0].amount
      );
      const contentOwnerRgt = rgtList.find(rgt => rgt.amount === maxRgt);
      certificatesData.push({
        ownerUsername: contentOwnerRgt.owner,
        researchId: research.id,
        researchGroupId: research.research_group_id,
        content: content.id,
        contentHash: content.content
      });
    }

    const getPdfStream = (html) => new Promise((resolve, reject) => {
      pdf.create(html, {
        width: '1440px',
        height: '900px',
        base: `file://${path.resolve(CERTIFICATE_BASE_PATH)}/`
      }).toStream(function (err, stream) {
        if (err) reject(err);
        else resolve(stream);
      });
    });

    if (certificatesData.length === 1) {
      const cData = certificatesData[0];
      const cHtml = await getContentCertificateHtml(cData);
      const despositionType = ctx.request.query.preview === 'true'
        ? 'inline'
        : 'attachment';
      ctx.response.set('Content-disposition', `${despositionType}; filename="deip-cert-${cData.contentHash}.pdf"`);
      ctx.type = 'application/pdf';
      ctx.body = await getPdfStream(cHtml);
    } else {
      const archive = archiver('zip');
      ctx.response.set('Content-disposition', `attachment; filename="deip-certs-${Date.now()}.zip"`);
      ctx.type = 'application/zip';
      ctx.body = archive;

      await Promise.all(certificatesData.map(async (cData) => {
        const cHtml = await getContentCertificateHtml(cData);
        const pdfStream = await getPdfStream(cHtml);
        archive.append(pdfStream, { name: `deip-cert-${cData.contentHash}.pdf` });
      }))
      archive.finalize();
    }
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const exportCypheredData = async (ctx) => {
  let hash = ctx.params.hash;
  let projectId = ctx.params.projectId;
  let jwtUsername = ctx.state.user.username;

  try {

    const fileRef = await filesService.findFileRefByHash(projectId, hash);
    if (!fileRef) {
      ctx.status = 404;
      ctx.body = `File with hash ${hash} is not found in ${projectId} project`;
      return;
    }

    const hasFileShared = await sharedFilesService.checkUserHasSharedFile({
      receiver: jwtUsername,
      fileRefId: fileRef._id,
      status: sharedFileStatus.UNLOCKED,
    });

    const authorized = await authorizeResearchGroup(fileRef.organizationId, jwtUsername);
    if (!authorized && !hasFileShared) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to get data for "${fileRef._id}" file`;
      return;
    }

    const accessItem = fileRef.accessKeys.find(k => k.name == jwtUsername);
    if (!accessItem) {
      ctx.status = 404;
      ctx.body = `Access for file ${fileRef.filename} is not allowed for ${jwtUsername}`;
      return;
    }

    let key = {
      "pubKey": accessItem.pubKey,
      "name": accessItem.name,
      "key": accessItem.key,
      "iv": fileRef.iv,
      "chunkSize": fileRef.chunkSize,
      "size": fileRef.size,
      "filename": fileRef.filename,
      "filetype": fileRef.filetype,
      "hash": fileRef.hash
    };

    const archive = archiver('zip');

    ctx.response.set('Content-disposition', `attachment; filename="${fileRef.hash}.zip"`);
    ctx.type = 'application/zip';
    ctx.body = archive;

    archive
      .append(JSON.stringify(key), { name: 'key.json' })
      .file(fileRef.filepath, { name: `${fileRef.filename}.aes` })
      .finalize();

  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const shareFile = async (ctx) => {
  const refId = ctx.params.refId;
  const jwtUsername = ctx.state.user.username;

  try {
    const {
      contractId,
      receiver
    } = ctx.request.body;

    const subscription = await subscriptionsService.findSubscriptionByOwner(jwtUsername);
    if (!subscription.isActive) {
      ctx.status = 402;
      ctx.body = `Subscription for ${jwtUsername} has expired`;
      return;
    }

    if (subscription.isLimitedPlan) {
      const limit = subscription.availableFilesSharesBySubscription + subscription.availableAdditionalFilesShares;
      if (limit === 0) {
        ctx.status = 402;
        ctx.body = `Subscription for ${jwtUsername} has reached the files share limit`;
        return;
      }
    }

    const [
      fileRef,
      contract,
      userProfile,
      isFileAlreadyShared,
    ] = await Promise.all([
      filesService.findFileRefById(refId),
      deipRpc.api.getNdaContractAsync(contractId),
      usersService.findUserById(receiver),
      sharedFilesService.checkUserHasSharedFile({
        fileRefId: refId,
        receiver
      })
    ]);

    if (isFileAlreadyShared) {
      ctx.status = 400;
      ctx.body = 'File is already shared';
      return;
    }

    if (!fileRef || !fileRef.filepath) {
      ctx.status = 400;
      ctx.body = `Invalid file state`;
      return;
    }

    if (!contract || contract.status !== 2) { // contract should have 'signed' status
      ctx.status = 400;
      ctx.body = 'Invalid contract state';
      return;
    }

    if (!userProfile) {
      ctx.status = 400;
      ctx.body = 'Receiver not found';
      return;
    }

    const sharedFile = await sharedFilesService.createSharedFile({
      fileRefId: fileRef._id,
      filename: fileRef.filename,
      sender: jwtUsername,
      receiver,
      contractId: contract.id,
      contractTitle: contract.title,
    });
    notifier.sendFileSharedNotifications(sharedFile._id);

    ctx.status = 200;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

export default {
  // refs
  getFileRefById,
  getFileRefByHash,
  listFileRefs,
  shareFile,

  exportCertificates,
  exportCypheredData
}