import fs from 'fs';
import fsExtra from "fs-extra";
import util from 'util';
import path from 'path';
import moment from 'moment';
import * as authService from './../services/auth';
import templatesService from './../services/templateRef';
import contractsService from './../services/contractRef';
import usersService from './../services/users';
import mailer from './../services/emails';
import { sendTransaction } from './../utils/blockchain';
import uuidv4 from "uuid/v4";
import send from 'koa-send';
import deipRpc from '@deip/deip-rpc-client';


const getContractRef = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;

  try {

    const contractRef = await contractsService.findContractRefById(refId);
    if (!contractRef) {
      ctx.status = 404;
      ctx.body = `Contract ${contractRef} is not found`;
      return;
    }

    if (contractRef.sender.username != jwtUsername && contractRef.receiver.username != jwtUsername) {
      ctx.status = 401;
      ctx.body = `You have no permissions to view ${refId}' contract`;
      return;
    }

    ctx.status = 200;
    ctx.body = contractRef;

  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
}

const getContractsRefsByParty = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const value = ctx.params.usernameOrEmail;

  try {

    const contractsRefs = await contractsService.findContractRefsByParty(value);
    if (contractsRefs.some(contractRef => contractRef.sender.username != jwtUsername && contractRef.receiver.username != jwtUsername)) {
      ctx.status = 401;
      ctx.body = `You have no permissions to view ${value}'s contracts`;
      return;
    }

    ctx.status = 200;
    ctx.body = contractsRefs;
  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
}

const getContractsRefsBySender = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const value = ctx.params.usernameOrEmail;

  try {

    const contractsRefs = await contractsService.findContractRefsBySender(value);
    if (contractsRefs.some(contractRef => contractRef.sender.username != jwtUsername && contractRef.receiver.username != jwtUsername)) {
      ctx.status = 401;
      ctx.body = `You have no permissions to view ${value}'s contracts`;
      return;
    }

    ctx.status = 200;
    ctx.body = contractsRefs;
  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
}

const createContractRef = async (ctx) => {
  const jwtUsername = ctx.state.user.username;

  try {
    const {
      templateRefId,
      senderEmail,
      receiverEmail,
      expirationDate
    } = ctx.request.body.contract;
  
    if (!senderEmail || !receiverEmail || senderEmail == receiverEmail) {
      ctx.status = 400;
      ctx.body = `Sender and receiver emails are required and must be not be equal`;
      return;
    }
  
    const templateRef = await templatesService.findTemplateRefById(templateRefId);
    if (!templateRef) {
      ctx.status = 400;
      ctx.body = `Template ${docRef} is not found`;
      return;
    }
  
    const sender = await usersService.findUserByEmail(senderEmail);
    if (!sender) {
      ctx.status = 400;
      ctx.body = `User ${senderEmail} is not found`;
      return;
    }
  
    if (sender._id != jwtUsername) {
      ctx.status = 400;
      ctx.body = `Only sender party can create a contract`;
      return;
    }
  
    if (!expirationDate || moment.utc(expirationDate).toDate().getTime() <= moment.utc().toDate().getTime()) {
      ctx.status = 400;
      ctx.body = `Expiration date ${expirationDate} is invalid`;
      return;
    }
  
    const [
      [senderAccount],
      { filepath, previewFilepath },
      receiver
    ] = await Promise.all([
      deipRpc.api.getAccountsAsync([sender._id]),
      moveTemplateToContract(templateRef, sender._id),
      usersService.findUserByEmail(receiverEmail),
    ]);
    let contractRef = {
      templateRef: Object.assign({}, JSON.parse(JSON.stringify(templateRef)), { filepath, previewFilepath }),
      sender: {
        email: senderEmail,
        pubKey: senderAccount.owner.key_auths[0][0],
        username: senderAccount.name
      },
      receiver: {
        email: receiverEmail,
      },
      expirationDate: moment.utc(expirationDate).toDate(),
      hash: null,
    };
    if (receiver) {
      contractRef.status = 'pending-sender-signature';
      const [receiverAccount] = await deipRpc.api.getAccountsAsync([receiver._id]);
      Object.assign(contractRef.receiver, {
        pubKey: receiverAccount.owner.key_auths[0][0],
        username: receiverAccount.name,
      })
    } else {
      contractRef.status = 'pending-receiver-registration';
    }
    contractRef = await contractsService.createContractRef(contractRef);
    await mailer.sendNDASignRequest(receiverEmail, contractRef._id, !receiver);

    ctx.status = 200;
    ctx.body = contractRef
  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
};

const getContractFile = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;
  const isDownload = ctx.query.download;

  const contractRef = await contractsService.findContractRefById(refId);
  if (!contractRef) {
    ctx.status = 404;
    ctx.body = `Template ${refId} is not found`;
    return;
  }

  if (contractRef.sender.username != jwtUsername && contractRef.receiver.username != jwtUsername) {
    ctx.status = 401;
    ctx.body = `You have no permissions to view ${refId}' contract`;
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

const createContract = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;

  try {
    const tx = ctx.request.body;
    const operationPayload = tx['operations'][0][1];

    let contractRef = await contractsService.findContractRefById(refId);
    if (contractRef.hash === operationPayload.contract_hash) {
      ctx.status = 400;
      ctx.body = 'Contract already created';
      return;
    } else if (jwtUsername !== contractRef.sender.username) {
      ctx.status = 403;
      return;
    } else {
      const result = await sendTransaction(tx);
      if (result.isSuccess) {
        contractRef = await contractsService.updateContractRefForCreatedContract(contractRef._id, operationPayload.contract_hash);
      }
    }
    
    ctx.status = 200;
    ctx.body = contractRef;
  } catch (err) {
    console.log(err);
    ctx.status = 500
  }
};

const signContract = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;

  const tx = ctx.request.body;

  try {
    let contractRef = await contractsService.findContractRefById(refId);
    if (!contractRef) {
      ctx.status = 404;
      ctx.body = `Contract ${contractRef} is not found`;
      return;
    }
    if (contractRef.status !== 'pending-receiver-signature') {
      ctx.status = 400;
      ctx.body = `Contract is ${contractRef.status}`;
      return;
    }
    if (jwtUsername !== contractRef.receiver.username) {
      ctx.status = 403;
      return;
    }

    const result = await sendTransaction(tx);
    if (result.isSuccess) {
      contractRef = await contractsService.updateContractRefForSignedContract(contractRef._id);
    }
    ctx.status = 200;
    ctx.body = contractRef;
  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
};

const declineContract = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;

  const tx = ctx.request.body;

  try {
    let contractRef = await contractsService.findContractRefById(refId);
    if (!contractRef) {
      ctx.status = 404;
      ctx.body = `Contract ${contractRef} is not found`;
      return;
    }
    if (contractRef.status !== 'pending-receiver-signature') {
      ctx.status = 400;
      ctx.body = `Contract is ${contractRef.status}`;
      return;
    }
    if (jwtUsername !== contractRef.receiver.username) {
      ctx.status = 403;
      return;
    }

    const result = await sendTransaction(tx);
    if (result.isSuccess) {
      contractRef = await contractsService.updateContractRefForDeclinedContract(contractRef._id);
    }

    ctx.status = 200;
    ctx.body = contractRef;
  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
};

export default {
  getContractRef,
  getContractsRefsByParty,
  getContractsRefsBySender,
  createContractRef,
  getContractFile,
  createContract,
  signContract,
  declineContract
}