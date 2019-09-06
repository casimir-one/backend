import fs from 'fs'
import path from 'path'
import util from 'util';
import deipRpc from '@deip/deip-rpc-client';
import filesService from './../services/fileRef';
import sharedFilesService from '../services/sharedFiles';
import ripemd160 from 'crypto-js/ripemd160';
import pdf from 'html-pdf';
import moment from 'moment';
import archiver from 'archiver';
import mailer from './../services/emails';
import usersService from './../services/users';
import { authorizeResearchGroup } from './../services/auth'

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

const exportCertificate = async (ctx) => {
  let hash = ctx.params.hash;
  let projectId = ctx.params.projectId;
  let jwtUsername = ctx.state.user.username;

  try {

    let chainResearch = await deipRpc.api.getResearchByIdAsync(projectId);
    let chainContents = await deipRpc.api.getAllResearchContentAsync(projectId);
    let chainContent = chainContents.find(c => c.content == hash);

    if (!chainResearch || !chainContent) {
      ctx.status = 400;
      ctx.body = `File with hash ${hash} is not found`;
      return;
    }

    let rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(chainResearch.research_group_id);
    let member = rgtList.find(rgt => rgt.owner === jwtUsername);

    if (!member) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to get certificates for "${projectId}" project`;
      return;
    }

    let maxRgt = rgtList.reduce(
      (max, rgt) => (rgt.amount > max ? rgt.amount : max),
      rgtList[0].amount
    );
    let owner = rgtList.find(rgt => rgt.amount === maxRgt);
    let ownerUsername = owner.owner;
    let ownerProfile = await usersService.findUserById(ownerUsername);
    let ownerName = ownerProfile.firstName && ownerProfile.lastName ? `${ownerProfile.firstName} ${ownerProfile.lastName}` : ownerUsername;

    let accounts = await deipRpc.api.getAccountsAsync([jwtUsername, ownerUsername]);
    let jwtPubKey = accounts[0].owner.key_auths[0][0];
    let ownerPubKey = accounts[1].owner.key_auths[0][0];

    let fileHist = await deipRpc.api.getContentHistoryByResearchAndHashAsync(chainResearch.id, hash);
    const headBlock = await deipRpc.api.getBlockAsync(fileHist.block);

    const certificateBasePath = './data/certificates/file_registered';
    let readFileAsync = util.promisify(fs.readFile);
    let rawHtml = await readFileAsync(`${certificateBasePath}/index.html`, 'utf8');

    let id = ripemd160(`${chainResearch.research_group_id}-${chainResearch.id}-${chainContent.id}-${chainContent.content}`).toString();

    var html = rawHtml.replace(/{{certificate_id}}/, id);
    html = html.replace(/{{project_id}}/, chainResearch.id);
    html = html.replace(/{{owner_name}}/, ownerName);
    html = html.replace(/{{registration_date}}/, moment(fileHist.timestamp).format("MMM DD, YYYY"));
    html = html.replace(/{{registration_time}}/, moment(fileHist.timestamp).format("HH:mm:ss"));
    html = html.replace(/{{file_hash}}/, chainContent.content);
    html = html.replace(/{{tx_hash}}/, fileHist.trx_id);
    html = html.replace(/{{block_number}}/, fileHist.block);
    html = html.replace(/{{block_hash}}/, headBlock.block_id);
    html = html.replace(/{{project_owner_public_key}}/, ownerPubKey);
    html = html.replace(/{{file_uploader_public_key}}/, jwtPubKey);
    html = html.replace(/{{chain_id}}/, process.env.CHAIN_ID);

    const base = path.resolve(certificateBasePath);
    const options = {
      width: '1440px',
      height: '900px',
      base: `file://${base}/`
    }

    let pdfStreamAsync = () => new Promise((resolve, reject) => {
      pdf.create(html, options).toStream(function (err, stream) {
        if (err) reject(err);
        else resolve(stream);
      });
    });

    let stream = await pdfStreamAsync();
    ctx.status = 200;
    ctx.body = stream;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


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

    const authorized = await authorizeResearchGroup(fileRef.organizationId, jwtUsername);
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to get data for "${projectId}" project`;
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

    const [
      fileRef,
      contract,
      userProfile,
      isFileAlreadyShared,
    ] = await Promise.all([
      filesService.findFileRefById(refId),
      deipRpc.api.getContractAsync(`${contractId}`),
      usersService.findUserById(receiver),
      sharedFilesService.checkFileAlreadyShared({
        fileRefId: refId,
        receiver,
        sender: jwtUsername
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
    await mailer.sendFileSharedNotification(userProfile.email, sharedFile._id);

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

  exportCertificate,
  exportCypheredData
}