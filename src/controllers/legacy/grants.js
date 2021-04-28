import path from 'path'
import AwardWithdrawalRequest from './../../schemas/awardWithdrawalRequest';
import GrantAwardPaymentForm from './../../forms/legacy/grantAwardPaymentForm';
import ResearchService from './../../services/impl/read/ProjectDtoService';
import GrantService from './../../services/grants';
import crypto from 'crypto';
import slug from 'limax';
import FileStorage from './../../storage';


const getAwardWithdrawalRequestRefByHash = async (ctx) => {
  const awardNumber = ctx.params.awardNumber;
  const paymentNumber = ctx.params.paymentNumber;
  try {
    const grantsService = new GrantService();
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

  const grantsService = new GrantService();

  const withdrawal = await grantsService.findAwardWithdrawalRequest(awardNumber, paymentNumber);
  if (!withdrawal) {
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


  const filename = file.filename;
  const filepath = FileStorage.getResearchAwardWithdrawalRequestsPackageFilePath(withdrawal.researchId, withdrawal.hash, filename);
  const ext = filename.substr(filename.lastIndexOf('.') + 1);
  const name = filename.substr(0, filename.lastIndexOf('.'));
  const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
  const isPdf = ['pdf'].some(e => e == ext);

  if (isDownload) {
    ctx.response.set('content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
  } else if (isImage) {
    ctx.response.set('content-type', `image/${ext}`);
    ctx.response.set('content-disposition', `inline; filename="${slug(name)}.${ext}"`);
  } else if (isPdf) {
    ctx.response.set('content-type', `application/${ext}`);
    ctx.response.set('content-disposition', `inline; filename="${slug(name)}.${ext}"`);
  } else {
    ctx.response.set('content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
  }

  const fileExists = await FileStorage.exists(filepath);
  if (!fileExists) {
    ctx.status = 404;
    ctx.body = `${filepath} is not found`;
    return;
  }

  const buff = await FileStorage.get(filepath);
  ctx.body = buff;
}


const createAwardWithdrawalRequest = async (ctx) => {
  const researchId = ctx.request.header['research-external-id'];
  const tenant = ctx.state.tenant;

  try {
    const researchService = new ResearchService();
    const grantsService = new GrantService();

    const research = await researchService.getResearch(researchId);

    const { tempDestinationPath, awardNumber, subawardNumber, paymentNumber } = await GrantAwardPaymentForm(ctx);

    const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };
    const hashObj = await FileStorage.calculateDirHash(tempDestinationPath, options);
    console.log(hashObj);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    const packageHash = crypto.createHash('sha256').update(hashes.join(",")).digest("hex");

    const withdrawal = await grantsService.findAwardWithdrawalRequest(awardNumber, paymentNumber);
    const researchAwardWithdrawalRequestsPackageDirPath = FileStorage.getResearchAwardWithdrawalRequestsPackageDirPath(researchId, packageHash);
    const researchAwardWithdrawalRequestsPackageDirExists = await FileStorage.exists(researchAwardWithdrawalRequestsPackageDirPath);

    if (researchAwardWithdrawalRequestsPackageDirExists) {
      console.log(`Folder ${packageHash} already exists! Removing the uploaded files...`);
      await FileStorage.delete(tempDestinationPath);
      ctx.status = 200;
      ctx.body = withdrawal;
    } else {
      await FileStorage.rename(tempDestinationPath, researchAwardWithdrawalRequestsPackageDirPath);

      if (withdrawal) {
        withdrawal.filename = `package [${packageHash}]`;
        withdrawal.folder = packageHash;
        const updatedWithdrawal = await withdrawal.save();
        ctx.status = 200;
        ctx.body = updatedWithdrawal;
      } else {
        const withdrawal = new AwardWithdrawalRequest({
          "tenantId": tenant.id,
          "filename": `package [${packageHash}]`,
          "folder": packageHash,
          "title": packageHash,
          "researchId": researchId,
          "researchGroupId": research.research_group.external_id,
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
  createAwardWithdrawalRequest,
  getAwardWithdrawalRequestRefByHash,
  getAwardWithdrawalRequestAttachmentFile
}