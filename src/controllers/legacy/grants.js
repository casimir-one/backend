import path from 'path'
import AwardWithdrawalRequestSchema from './../../schemas/AwardWithdrawalRequestSchema';
import GrantAwardPaymentForm from './../../forms/legacy/grantAwardPaymentForm';
import NftCollectionDtoService from '../../services/impl/read/NftCollectionDtoService';
import GrantService from './../../services/legacy/grants';
import { NotFoundError } from './../../errors';
import crypto from 'crypto';
import slug from 'limax';
import FileStorage from './../../storage';


const getAwardWithdrawalRequestRefByHash = async (ctx) => {
  const awardNumber = ctx.params.awardNumber;
  const paymentNumber = ctx.params.paymentNumber;
  try {
    const grantsService = new GrantService();
    const ref = await grantsService.findAwardWithdrawalRequest(awardNumber, paymentNumber);
    ctx.successRes(ref);
  } catch (err) {
    ctx.errorRes(err);
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
    throw new NotFoundError(`File "${fileHash}" is not found`);
  }

  const file = withdrawal.packageFiles.find(f => f.hash == fileHash);
  if (!file) {
    throw new NotFoundError(`File "${fileHash}" is not found`);
  }


  const filename = file.filename;
  const filepath = FileStorage.getProjectAwardWithdrawalRequestsPackageFilePath(withdrawal.projectId, withdrawal.hash, filename);
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
    throw new NotFoundError(`${filepath} is not found`);
  }

  const buff = await FileStorage.get(filepath);
  ctx.successRes(buff, { withoutWrap: true });
}


const createAwardWithdrawalRequest = async (ctx) => {
  const projectId = ctx.request.header['nft-collection-id'];
  const portal = ctx.state.portal;

  try {
    const nftCollectionDtoService = new NftCollectionDtoService();
    const grantsService = new GrantService();

    const project = await nftCollectionDtoService.getNftCollection(projectId);

    const { tempDestinationPath, awardNumber, subawardNumber, paymentNumber } = await GrantAwardPaymentForm(ctx);

    const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };
    const hashObj = await FileStorage.calculateDirHash(tempDestinationPath, options);
    console.log(hashObj);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    const packageHash = crypto.createHash('sha256').update(hashes.join(",")).digest("hex");

    const withdrawal = await grantsService.findAwardWithdrawalRequest(awardNumber, paymentNumber);
    const projectAwardWithdrawalRequestsPackageDirPath = FileStorage.getProjectAwardWithdrawalRequestsPackageDirPath(projectId, packageHash);
    const projectAwardWithdrawalRequestsPackageDirExists = await FileStorage.exists(projectAwardWithdrawalRequestsPackageDirPath);

    if (projectAwardWithdrawalRequestsPackageDirExists) {
      console.log(`Folder ${packageHash} already exists! Removing the uploaded files...`);
      await FileStorage.delete(tempDestinationPath);
      ctx.successRes(withdrawal);
    } else {
      await FileStorage.rename(tempDestinationPath, projectAwardWithdrawalRequestsPackageDirPath);

      if (withdrawal) {
        withdrawal.filename = `package [${packageHash}]`;
        withdrawal.folder = packageHash;
        const updatedWithdrawal = await withdrawal.save();
        ctx.successRes(updatedWithdrawal);
      } else {
        const withdrawal = new AwardWithdrawalRequestSchema({
          "portalId": portal.id,
          "filename": `package [${packageHash}]`,
          "folder": packageHash,
          "title": packageHash,
          "projectId": projectId,
          "teamId": project.teamId,
          "paymentNumber": paymentNumber,
          "awardNumber": awardNumber,
          "subawardNumber": subawardNumber,
          "hash": packageHash,
          "packageFiles": hashObj.children.map((f) => {
            return { filename: f.name, hash: f.hash, ext: path.extname(f.name) }
          })
        });
        const savedWithdrawal = await withdrawal.save();
        ctx.successRes(savedWithdrawal);
      }
    }

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
  }
}

export default {
  createAwardWithdrawalRequest,
  getAwardWithdrawalRequestRefByHash,
  getAwardWithdrawalRequestAttachmentFile
}