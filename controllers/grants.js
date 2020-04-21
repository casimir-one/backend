import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import deipRpc from '@deip/rpc-client';
import AwardWithdrawalRequest from './../schemas/awardWithdrawalRequest';
import { hashElement } from 'folder-hash';
import send from 'koa-send';
import grantsService from './../services/grants';
import { bulkAwardWithdrawalRequestAttachmentsUploader } from './../storages/bulkAwardWithdrawalRequestAttachmentsUploader';
import { authorizeResearchGroup } from './../services/auth'
import crypto from 'crypto';
import rimraf from "rimraf";
import slug from 'limax';
import config from './../config';

const storagePath = path.join(__dirname, `./../${config.fileStorageDir}`);

const researchAwardWithdrawalRequestsFilesStoragePath = (researchId) => `${storagePath}/research-projects/${researchId}/award-withdrawal-requests-attachments`
const researchAwardWithdrawalRequestsFilesTempStoragePath = (researchId, postfix) => `${researchAwardWithdrawalRequestsFilesStoragePath(researchId)}/temp-${postfix}`
const researchAwardWithdrawalRequestsFilesPackagePath = (researchId, packageHash) => `${researchAwardWithdrawalRequestsFilesStoragePath(researchId)}/${packageHash}`
const researchAwardWithdrawalRequestsFilesPackageFilePath = (researchId, packageHash, fileHash) => `${researchAwardWithdrawalRequestsFilesPackagePath(researchId, packageHash)}/${fileHash}`


const getAwardWithdrawalRequestRefByHash = async (ctx) => {
  const awardNumber = ctx.params.awardNumber;
  const paymentNumber = ctx.params.paymentNumber;

  try {
    const ref = await grantsService.findAwardWithdrawalRequest(awardNumber, paymentNumber);
    ctx.status = 200;
    ctx.body = ref;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getAwardWithdrawalRequestAttachmentFile = async function (ctx) {
  const fileHash = ctx.params.fileHash;
  const awardNumber = ctx.params.awardNumber;
  const paymentNumber = ctx.params.paymentNumber;
  const isDownload = ctx.query.download === 'true';

  const withdrawal = await grantsService.findAwardWithdrawalRequest(awardNumber, paymentNumber);
  if (withdrawal == null) {
    ctx.status = 404;
    ctx.body = `File "${fileHash}" is not found`
    return;
  }

  const file = withdrawal.packageFiles.find(f => f.hash == fileHash);
  if (!file) {
    ctx.status = 404;
    ctx.body = `File "${fileHash}" is not found`
    return;
  }

  if (isDownload) {
    let ext = file.filename.substr(file.filename.lastIndexOf('.') + 1);
    let name = file.filename.substr(0, file.filename.lastIndexOf('.'));
    ctx.response.set('Content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
    ctx.body = fs.createReadStream(researchAwardWithdrawalRequestsFilesPackageFilePath(withdrawal.researchId, withdrawal.hash, file.filename));
  } else {
    await send(ctx, researchAwardWithdrawalRequestsFilesPackageFilePath(withdrawal.researchId, withdrawal.hash, file.filename), { root: '/' });
  }  
}


const uploadAwardWithdrawalRequestBulkAttachments = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchId = ctx.request.header['research-id'];
  const awardNumber = ctx.request.header['award-number'];
  const subawardNumber = ctx.request.header['subaward-number'];
  const paymentNumber = ctx.request.header['payment-number'];

  if (researchId == undefined) {
    ctx.status = 400;
    ctx.body = { error: `"research-id" header is required` };
    return;
  }

  if (!awardNumber || !subawardNumber || !paymentNumber) {
    ctx.status = 400;
    ctx.body = { error: `"award-number", "subaward-number", "payment-number" headers are required` };
    return;
  }

  const stat = util.promisify(fs.stat);
  const ensureDir = util.promisify(fsExtra.ensureDir);

  try {
    const researchFilesTempStorage = researchAwardWithdrawalRequestsFilesTempStoragePath(ctx.request.header['research-id'], ctx.request.header['upload-session'])
    await ensureDir(researchFilesTempStorage);

    const research = await deipRpc.api.getResearchByIdAsync(researchId);
    const authorized = await authorizeResearchGroup(research.research_group_id, jwtUsername)
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to post to "${researchId}" research`;
      return;
    }


    const attachmentsContent = bulkAwardWithdrawalRequestAttachmentsUploader.any();
    const tempDestinationPath = await attachmentsContent(ctx, () => new Promise((resolve, reject) => {
      if (!ctx.req.files[0] || !ctx.req.files[0].destination) {
        reject(new Error(`No destination path found during bulk-uploading`))
        return;
      }
      fs.stat(ctx.req.files[0].destination, (err, stats) => {
        if (err || !stats.isDirectory()) {
          console.error(err);
          reject(err)
        }
        else {
          resolve(ctx.req.files[0].destination);
        }
      });
    }));


    const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };
    const hashObj = await hashElement(tempDestinationPath, options);
    console.log(hashObj);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    const packageHash = crypto.createHash('sha256').update(hashes.join(",")).digest("hex");

    var exists = false;
    const withdrawal = await grantsService.findAwardWithdrawalRequest(awardNumber, paymentNumber);
    const packagePath = researchAwardWithdrawalRequestsFilesPackagePath(researchId, packageHash);


    if (withdrawal) {
      try {
        const check = await stat(packagePath);
        exists = true;
      } catch (err) {
        exists = false;
      }
    }


    if (exists) {
      console.log(`Folder ${packageHash} already exists! Removing the uploaded files...`);
      rimraf(tempDestinationPath, function () { console.log(`${tempDestinationPath} removed`); });
      ctx.status = 200;
      ctx.body = withdrawal;
    } else {

      await fsExtra.move(tempDestinationPath, packagePath, { overwrite: true });

      if (withdrawal) {
        withdrawal.filename = `package: [${packageHash}]`
        const updatedWithdrawal = await withdrawal.save();
        ctx.status = 200;
        ctx.body = updatedWithdrawal;
      } else {
        const withdrawal = new AwardWithdrawalRequest({
          "filename": `package [${packageHash}]`,
          "title": `${packageHash}`,
          "researchId": researchId,
          "researchGroupId": research.research_group_id,
          "paymentNumber": paymentNumber,
          "awardNumber": awardNumber,
          "subawardNumber": subawardNumber,
          "hash": packageHash,
          "packageFiles": hashObj.children.map((f) => {
            return { filename: f.name, hash: f.hash, ext: path.extname(f.name) }
          })
        });
        const savedWithdrawal = await withdrawal.save();
        ctx.status = 200;
        ctx.body = savedWithdrawal;
      }
    }

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
  uploadAwardWithdrawalRequestBulkAttachments,
  getAwardWithdrawalRequestRefByHash,
  getAwardWithdrawalRequestAttachmentFile
}