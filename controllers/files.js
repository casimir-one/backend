import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import send from 'koa-send';
import deipRpc from '@deip/deip-rpc-client';
import FileRef from './../schemas/fileRef';
import UserProfile from './../schemas/user';
import config from './../config';
import filesService from './../services/fileRef';
import crypto from 'crypto';
import ripemd160 from 'crypto-js/ripemd160';
import pdf from 'html-pdf';
import moment from 'moment';

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
    let ownerProfile = await UserProfile.findOne({ '_id': ownerUsername });
    let ownerName = ownerProfile.firstName && ownerProfile.lastName ? `${ownerProfile.firstName} ${ownerProfile.lastName}` : ownerUsername;

    let accounts = await deipRpc.api.getAccountsAsync([jwtUsername, ownerUsername]);
    let jwtPubKey = accounts[0].owner.key_auths[0][0];
    let ownerPubKey = accounts[1].owner.key_auths[0][0];

    let hist = await deipRpc.api.getContentHistoryAsync(hash);
    let fileHist = hist[0];

    let readFileAsync = util.promisify(fs.readFile);
    let rawHtml = await readFileAsync('./certificates/file/certificate.html', 'utf8');

    let id = ripemd160(`${chainResearch.research_group_id}-${chainResearch.id}-${chainContent.id}-${chainContent.content}`).toString();

    var html = rawHtml.replace(/{{certificate_id}}/, id);
    html = html.replace(/{{project_id}}/, chainResearch.id);
    html = html.replace(/{{owner_name}}/, ownerName);
    html = html.replace(/{{registration_date}}/, moment(ownerProfile.created_at).format("MM/DD/YYYY"));
    html = html.replace(/{{file_hash}}/, chainContent.content);
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

  exportCertificate
}