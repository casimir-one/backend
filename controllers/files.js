import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import send from 'koa-send';
import deipRpc from '@deip/deip-rpc-client';
import FileRef from './../schemas/fileRef';
import UserProfile from './../schemas/user';
import { hashElement } from 'folder-hash';
import config from './../config';
import { sendTransaction } from './../utils/blockchain';
import { findFileRefById, findFileRefByHash, createFileRef } from './../services/fileRef';
import { authorizeResearchGroup } from './../services/auth';
import crypto from 'crypto';
import rimraf from "rimraf";
import slug from 'limax';
import pdf from 'html-pdf';
import moment from 'moment';

const listFileRefs = async (ctx) => {
  const projectId = ctx.params.projectId;
  try {
    const refs = await FileRef.find({ 'projectId': projectId });
    ctx.status = 200;
    ctx.body = refs;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const postFileRef = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const data = ctx.request.body;

  try {
    let {
      organizationId,
      projectId,
      filename,
      filetype,
      size,
      status
    } = data;

    const authorized = await authorizeResearchGroup(organizationId, jwtUsername);
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${organizationId}" group.`
      return;
    }

    let filepath = data.filepath || null;
    let hash = data.hash || null;
    let iv = data.iv || null;
    let chunkSize = data.chunkSize || null;
    let fileAccess = data.fileAccess || [];
    let permlink = data.permlink || null;

    if (organizationId == undefined || projectId == undefined || !filename || !filetype || !size || !status) {
      ctx.status = 400;
      console.log(data);
      ctx.body = `Mandatory fields are not specified`;
      return;
    }

    if (status == "timestamped" && (!hash || !permlink)) {
      ctx.status = 400;
      ctx.body = `For 'timestamped' status hash and permlink fields must be specified`;
      return;
    }

    // if (status == "uploaded" && (!iv || !chunkSize || !filepath || !fileAccess)) {
    //   ctx.status = 400;
    //   ctx.body = `For 'uploaded' status iv, chunkSize, filepath, fileAccess fields must be specified`;
    //   return;
    // }

    // if (status == "uploaded_and_timestamped" && (!hash || !iv || !chunkSize || !filepath || !fileAccess || !permlink)) {
    //   ctx.status = 400;
    //   ctx.body = `For 'uploaded_and_timestamped' status hash, iv, chunkSize, filepath, fileAccess fields must be specified`;
    //   return;
    // }

    let ref = await createFileRef(organizationId, projectId, filename, filetype, filepath, size, hash, iv, chunkSize, permlink, fileAccess, status);
    ctx.status = 200;
    ctx.body = ref;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getFileRefById = async (ctx) => {
  const refId = ctx.params.refId;
  try {
    const ref = await findFileRefById(refId);
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
    const ref = await findFileRefByHash(projectId, hash);
    ctx.status = 200;
    ctx.body = ref;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getCertificate = async (ctx) => {
  let hash = ctx.params.hash;
  let projectId = ctx.params.projectId;
  let jwtUsername = ctx.state.user.username;

  try {

    let file = await findFileRefByHash(projectId, hash);
    let rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(file.organizationId);
    let member = rgtList.find(rgt => rgt.owner === jwtUsername);

    if (!member) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to get certificates for "${file.projectId}" project`;
      return;
    }

    let maxRgt = rgtList.reduce(
      (max, rgt) => (rgt.amount > max ? rgt.amount : max),
      rgtList[0].amount
    );

    let owner = rgtList.find(rgt => rgt.amount === maxRgt);
    let ownerUsername = owner.owner;
    let ownerProfile = await UserProfile.findOne({ '_id': ownerUsername });
    let ownerName = ownerProfile.firstName && ownerProfile.lastName ? `${ownerProfile.firstName} ${ownerProfile.lastName}` : ownerUsername;


    let accounts = await deipRpc.api.getAccountsAsync([jwtUsername, ownerUsername]);
    let jwtPubKey = accounts[0].owner.key_auths[0][0];
    let ownerPubKey = accounts[1].owner.key_auths[0][0];

    let hist = await deipRpc.api.getContentHistoryAsync(hash);
    let fileHist = hist[0];

    // let chainProject = await deipRpc.api.getResearchByIdAsync(file.projectId);

    let readFileAsync = util.promisify(fs.readFile);
    let rawHtml = await readFileAsync('./certificates/file/certificate.html', 'utf8');

    var html = rawHtml.replace(/{{certificate_id}}/, file._id.toString());
    html = html.replace(/{{project_id}}/, file.projectId);
    html = html.replace(/{{owner_name}}/, ownerName);
    html = html.replace(/{{registration_date}}/, moment(ownerProfile.created_at).format("MM/DD/YYYY"));
    html = html.replace(/{{file_hash}}/, file.hash);
    html = html.replace(/{{tx_hash}}/, fileHist.trx_id);
    html = html.replace(/{{tx_timestamp}}/, moment(fileHist.timestamp).format("MM/DD/YYYY HH:mm:ss"));
    html = html.replace(/{{block_number}}/, fileHist.block);
    html = html.replace(/{{project_owner_public_key}}/, ownerPubKey);
    html = html.replace(/{{file_uploader_public_key}}/, jwtPubKey);
    html = html.replace(/{{chain_id}}/, process.env.CHAIN_ID);

    const options = {
      "format": "A4",
      "orientation": "landscape"
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

export default {
  // refs
  getFileRefById,
  getFileRefByHash,
  listFileRefs,
  postFileRef,

  getCertificate
}