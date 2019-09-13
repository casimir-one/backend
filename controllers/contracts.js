import fs from 'fs';
import fsExtra from "fs-extra";
import util from 'util';
import moment from 'moment';
import templatesService from './../services/templateRef';
import contractsService from './../services/contractRef';
import usersService from './../services/users';
import subscriptionsService from './../services/subscriptions';
import mailer from './../services/emails';
import { sendTransaction } from './../utils/blockchain';
import uuidv4 from "uuid/v4";
import send from 'koa-send';
import deipRpc from '@deip/deip-rpc-client';

const getContractRef = async (ctx) => {
  const refId = ctx.params.refId;

  try {
    const contractRef = await contractsService.findContractRefById(refId);
    if (!contractRef) {
      ctx.status = 404;
      ctx.body = `Contract ${contractRef} is not found`;
      return;
    }

    ctx.status = 200;
    ctx.body = contractRef;
  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
};

const createContractRef = async (ctx) => {
  const jwtUsername = ctx.state.user.username;

  try {
    const {
      templateRefId,
      signedTx
    } = ctx.request.body;
    const {
      creator: creatorUsername,
      signee: receiverUsername,
      contract_hash: contractHash,
      end_date: expirationDate
    } = signedTx['operations'][0][1];

    const subscription = await subscriptionsService.findSubscriptionByOwner(jwtUsername);
    if (!subscription.isActive) {
      ctx.status = 402;
      ctx.body = `Subscription for ${jwtUsername} has expired`;
      return;
    }
    if (subscription.isLimitedPlan && subscription.availableContractsBySubscription === 0) {
      ctx.status = 402;
      ctx.body = `Subscription for ${jwtUsername} has reached the contracts limit`;
      return;
    }
  
    const templateRef = await templatesService.findTemplateRefById(templateRefId);
    if (!templateRef) {
      ctx.status = 400;
      ctx.body = `Template ${docRef} is not found`;
      return;
    }
  
    if (creatorUsername != jwtUsername) {
      ctx.status = 400;
      ctx.body = `Only sender party can create a contract`;
      return;
    }

    if (!expirationDate || moment.utc(expirationDate).toDate().getTime() <= moment.utc().toDate().getTime()) {
      ctx.status = 400;
      ctx.body = `Expiration date ${expirationDate} is invalid`;
      return;
    }

    const [receiverAccount] = await deipRpc.api.getAccountsAsync([receiverUsername]);
    if (!receiverAccount) {
      ctx.status = 400;
      ctx.body = `User ${receiver} does not exist`;
      return;
    }

    const result = await sendTransaction(signedTx);
    if (!result.isSuccess) {
      ctx.status = 400;
      ctx.body = 'Error while contract creation';
      return;
    }
    const activeContract = await deipRpc.api.getNdaContractsByHashAsync(contractHash)
      .then((contracts) => contracts.filter(c => c.status === 1)[0]);

    const { filepath, previewFilepath } = await moveTemplateToContract(templateRef, creatorUsername);
    const [
      contractRef,
      receiverProfile
    ] = await Promise.all([
      contractsService.createContractRef({
        contractId: activeContract.id,
        templateRef: { ...templateRef, filepath, previewFilepath },
      }),
      usersService.findUserById(receiverUsername)
    ]);
    if (subscription.isLimitedPlan) {
      await subscriptionsService.setSubscriptionCounters(subscription.id, {
        contracts: subscription.availableContractsBySubscription - 1,
      })
    }
    if (receiverProfile && receiverProfile.email) {
      // await mailer.sendNDASignRequest(receiverProfile.email, contractRef._id);
    }

    ctx.status = 201;
    ctx.body = contractRef;
  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
};

const getContractFile = async (ctx) => {
  const refId = ctx.params.refId;
  const isDownload = ctx.query.download;

  const contractRef = await contractsService.findContractRefById(refId);
  if (!contractRef) {
    ctx.status = 404;
    ctx.body = `Template ${refId} is not found`;
    return;
  }

  if (isDownload) {
    ctx.response.set('Content-disposition', 'attachment; filename="' + contractRef.templateRef.originalname + '"');
    ctx.body = fs.createReadStream(contractRef.templateRef.filepath);
  } else {
    await send(ctx, contractRef.templateRef.previewFilepath);
  }
}

async function moveTemplateToContract(templateRef, sender) {
  const copyFileAsync = util.promisify(fs.copyFile);
  const ensureDir = util.promisify(fsExtra.ensureDir);
  const dest = `files/contracts/${sender}`;
  await ensureDir(dest);

  const filepath = `${dest}/${uuidv4()}_${templateRef.originalname}`;
  await copyFileAsync(templateRef.filepath, filepath);
  let previewFilepath = filepath;
  if (templateRef.filepath != templateRef.previewFilepath) {
    previewFilepath = `${filepath}.pdf`;
    await copyFileAsync(templateRef.previewFilepath, previewFilepath);
  }

  return { filepath, previewFilepath };
}

export default {
  getContractRef,
  createContractRef,
  getContractFile,
}