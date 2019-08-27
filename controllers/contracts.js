import fs from 'fs';
import fsExtra from "fs-extra";
import util from 'util';
import path from 'path';
import moment from 'moment';
import CryptoJS from 'crypto-js';
import * as authService from './../services/auth';
import templatesService from './../services/templateRef';
import contractsService from './../services/contractRef';
import usersService from './../services/users';
import filesService from './../services/fileRef';
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
    ctx.body = templateRef;

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


const createContract = async (ctx) => {
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

    const receiver = await usersService.findUserByEmail(receiverEmail);
    if (receiver) {
      const [senderAccount, receiverAccount] = await deipRpc.api.getAccountsAsync([sender._id, receiver._id]);
      if (!senderAccount || !receiverAccount) {
        ctx.status = 400;
        ctx.body = `User account is not found`;
        return;
      }

      const senderPubKey = senderAccount.owner.key_auths[0][0];
      const receiverPubKey = receiverAccount.owner.key_auths[0][0];
      const hash = CryptoJS.SHA256(`${senderPubKey},${receiverPubKey},${templateRef.hash}`).toString(CryptoJS.enc.Hex);

      // todo: send create_contract_operation to the chain

      const contractRef = await contractsService.createContractRef({
        templateRef: templateRef._id,
        sender: {
          email: senderEmail,
          pubKey: senderPubKey,
          username: senderAccount.name
        },
        receiver: {
          email: receiverEmail,
          pubKey: receiverPubKey,
          username: receiverAccount.name
        },
        status: 'pending-receiver-signature',
        hash: hash,
        expirationDate: moment.utc(expirationDate).toDate()
      });

      await templatesService.linkContractRefToTemplateRef(templateRef._id, contractRef._id);

      ctx.status = 200;
      ctx.body = contractRef;
    
    } else {

      const [senderAccount] = await deipRpc.api.getAccountsAsync([sender._id]);
      if (!senderAccount) {
        ctx.status = 400;
        ctx.body = `Sender account is not found`;
        return;
      }

      const senderPubKey = senderAccount.owner.key_auths[0][0];
      const contractRef = await contractsService.createContractRef({
        templateRef: templateRef._id,
        sender: {
          email: senderEmail,
          pubKey: senderPubKey,
          username: senderAccount.name
        },
        receiver: {
          email: receiverEmail,
          pubKey: null,
          username: null
        },
        status: 'pending-sender-signature',
        hash: null,
        expirationDate: moment.utc(expirationDate).toDate()
      });

      await templatesService.linkContractRefToTemplateRef(templateRef._id, contractRef._id);

      ctx.status = 200;
      ctx.body = contractRef;
    }

  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
}


export default {
  getContractRef,
  getContractsRefsByParty,
  getContractsRefsBySender,
  createContract
}