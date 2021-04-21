import * as blockchainService from './../../utils/blockchain';
import { SMART_CONTRACT_TYPE } from './../../constants';
import ProposalService from './../../services/proposal';

import ResearchProposalSignedEvent from './../../events/legacy/researchProposalSignedEvent';
import ResearchUpdateProposalSignedEvent from './../../events/legacy/researchUpdateProposalSignedEvent';
import ResearchContentProposalSignedEvent from './../../events/legacy/researchContentProposalSignedEvent';
import ResearchTokenSaleProposalSignedEvent from './../../events/legacy/researchTokenSaleProposalSignedEvent';
import ResearchGroupUpdateProposalSignedEvent from './../../events/legacy/researchGroupUpdateProposalSignedEvent';
import AssetTransferProposalSignedEvent from './../../events/legacy/assetTransferProposalSignedEvent';
import AssetExchangeProposalSignedEvent from './../../events/legacy/assetExchangeProposalSignedEvent';
import ResearchExpressLicenseProposalSignedEvent from './../../events/legacy/researchExpressLicenseProposalSignedEvent';
import UserInvitationProposalSignedEvent from './../../events/legacy/userInvitationProposalSignedEvent';
import UserResignationProposalSignedEvent from './../../events/legacy/userResignationProposalSignedEvent';
import ResearchNdaProposalSignedEvent from './../../events/legacy/researchNdaProposalSignedEvent'

import ResearchProposalRejectedEvent from './../../events/legacy/researchProposalRejectedEvent';
import ResearchUpdateProposalRejectedEvent from './../../events/legacy/researchUpdateProposalRejectedEvent';
import ResearchContentProposalRejectedEvent from './../../events/legacy/researchContentProposalRejectedEvent';
import ResearchTokenSaleProposalRejectedEvent from './../../events/legacy/researchTokenSaleProposalRejectedEvent';
import ResearchGroupUpdateProposalRejectedEvent from './../../events/legacy/researchGroupUpdateProposalRejectedEvent';
import AssetTransferProposalRejectedEvent from './../../events/legacy/assetTransferProposalRejectedEvent';
import AssetExchangeProposalRejectedEvent from './../../events/legacy/assetExchangeProposalRejectedEvent';
import ResearchExpressLicenseProposalRejectedEvent from './../../events/legacy/researchExpressLicenseProposalRejectedEvent';
import UserInvitationProposalRejectedEvent from './../../events/legacy/userInvitationProposalRejectedEvent';
import UserResignationProposalRejectedEvent from './../../events/legacy/userResignationProposalRejectedEvent';
import ResearchNdaProposalRejectedEvent from './../../events/legacy/researchNdaProposalRejectedEvent';


const createProposal = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { creator: researchGroupAccount} = payload;

    const txResult = await blockchainService.sendTransactionAsync(tx);
    ctx.status = 200;
    ctx.body = { tx, txResult };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const updateProposal = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const proposalsService = new ProposalService();
    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: proposalId } = payload;
  
    await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);
    const updatedProposal = await proposalsService.getProposal(proposalId);


    if (updatedProposal.type == SMART_CONTRACT_TYPE.CREATE_RESEARCH) {
      const researchProposalSignedEvent = new ResearchProposalSignedEvent(datums);
      ctx.state.events.push(researchProposalSignedEvent);
    }

    if (updatedProposal.type == SMART_CONTRACT_TYPE.UPDATE_RESEARCH) {
      const researchUpdateProposalSignedEvent = new ResearchUpdateProposalSignedEvent(datums);
      ctx.state.events.push(researchUpdateProposalSignedEvent);
    }

    if (updatedProposal.type == SMART_CONTRACT_TYPE.CREATE_RESEARCH_CONTENT) { // wip
      const researchContentProposalSignedEvent = new ResearchContentProposalSignedEvent(datums);
      ctx.state.events.push(researchContentProposalSignedEvent);
    }

    if (updatedProposal.type == SMART_CONTRACT_TYPE.CREATE_RESEARCH_TOKEN_SALE) {
      const researchTokenSaleProposalSignedEvent = new ResearchTokenSaleProposalSignedEvent(datums);
      ctx.state.events.push(researchTokenSaleProposalSignedEvent);
    }

    if (updatedProposal.type == SMART_CONTRACT_TYPE.UPDATE_RESEARCH_GROUP) {
      const researchGroupUpdateProposalSignedEvent = new ResearchGroupUpdateProposalSignedEvent(datums);
      ctx.state.events.push(researchGroupUpdateProposalSignedEvent);
    }

    if (updatedProposal.type == SMART_CONTRACT_TYPE.ASSET_TRANSFER) {
      const assetTransferProposalSignedEvent = new AssetTransferProposalSignedEvent(datums);
      ctx.state.events.push(assetTransferProposalSignedEvent);
    }

    if (updatedProposal.type == SMART_CONTRACT_TYPE.ASSET_EXCHANGE) {
      const assetExchangeProposalSignedEvent = new AssetExchangeProposalSignedEvent(datums);
      ctx.state.events.push(assetExchangeProposalSignedEvent);
    }

    if (updatedProposal.type == SMART_CONTRACT_TYPE.EXPRESS_LICENSE_REQUEST) {
      const researchExpressLicenseProposalSignedEvent = new ResearchExpressLicenseProposalSignedEvent(datums);
      ctx.state.events.push(researchExpressLicenseProposalSignedEvent);
    }

    if (updatedProposal.type == SMART_CONTRACT_TYPE.INVITE_MEMBER) {
      const userInvitationProposalSignedEvent = new UserInvitationProposalSignedEvent(datums);
      ctx.state.events.push(userInvitationProposalSignedEvent);
    }

    if (updatedProposal.type == SMART_CONTRACT_TYPE.EXCLUDE_MEMBER) {
      const userResignationProposalSignedEvent = new UserResignationProposalSignedEvent(datums);
      ctx.state.events.push(userResignationProposalSignedEvent);
    }

    if (updatedProposal.type == SMART_CONTRACT_TYPE.RESEARCH_NDA) {
      const researchNdaProposalSignedEvent = new ResearchNdaProposalSignedEvent(datums);
      ctx.state.events.push(researchNdaProposalSignedEvent);
    }

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const deleteProposal = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const proposalsService = new ProposalService();
    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: proposalId } = payload;

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const deletedProposal = await proposalsService.getProposal(proposalId);

    if (deletedProposal.type == SMART_CONTRACT_TYPE.CREATE_RESEARCH) {
      const researchProposalRejectedEvent = new ResearchProposalRejectedEvent(datums);
      ctx.state.events.push(researchProposalRejectedEvent);
    }

    if (deletedProposal.type == SMART_CONTRACT_TYPE.UPDATE_RESEARCH) {
      const researchUpdateProposalRejectedEvent = new ResearchUpdateProposalRejectedEvent(datums);
      ctx.state.events.push(researchUpdateProposalRejectedEvent);
    }

    if (deletedProposal.type == SMART_CONTRACT_TYPE.CREATE_RESEARCH_CONTENT) { // wip
      const researchContentProposalRejectedEvent = new ResearchContentProposalRejectedEvent(datums);
      ctx.state.events.push(researchContentProposalRejectedEvent);
    }

    if (deletedProposal.type == SMART_CONTRACT_TYPE.CREATE_RESEARCH_TOKEN_SALE) {
      const researchTokenSaleProposalRejectedEvent = new ResearchTokenSaleProposalRejectedEvent(datums);
      ctx.state.events.push(researchTokenSaleProposalRejectedEvent);
    }

    if (deletedProposal.type == SMART_CONTRACT_TYPE.UPDATE_RESEARCH_GROUP) {
      const researchGroupUpdateProposalRejectedEvent = new ResearchGroupUpdateProposalRejectedEvent(datums);
      ctx.state.events.push(researchGroupUpdateProposalRejectedEvent);
    }

    if (deletedProposal.type == SMART_CONTRACT_TYPE.ASSET_TRANSFER) {
      const assetTransferProposalRejectedEvent = new AssetTransferProposalRejectedEvent(datums);
      ctx.state.events.push(assetTransferProposalRejectedEvent);
    }

    if (deletedProposal.type == SMART_CONTRACT_TYPE.ASSET_EXCHANGE) {
      const assetExchangeProposalRejectedEvent = new AssetExchangeProposalRejectedEvent(datums);
      ctx.state.events.push(assetExchangeProposalRejectedEvent);
    }

    if (deletedProposal.type == SMART_CONTRACT_TYPE.EXPRESS_LICENSE_REQUEST) {
      const researchExpressLicenseProposalRejectedEvent = new ResearchExpressLicenseProposalRejectedEvent(datums);
      ctx.state.events.push(researchExpressLicenseProposalRejectedEvent);
    }

    if (deletedProposal.type == SMART_CONTRACT_TYPE.INVITE_MEMBER) {
      const userInvitationProposalRejectedEvent = new UserInvitationProposalRejectedEvent(datums);
      ctx.state.events.push(userInvitationProposalRejectedEvent);
    }

    if (deletedProposal.type == SMART_CONTRACT_TYPE.EXCLUDE_MEMBER) {
      const userResignationProposalRejectedEvent = new UserResignationProposalRejectedEvent(datums);
      ctx.state.events.push(userResignationProposalRejectedEvent);
    }

    if (deletedProposal.type == SMART_CONTRACT_TYPE.RESEARCH_NDA) {
      const researchNdaProposalRejectedEvent = new ResearchNdaProposalRejectedEvent(datums);
      ctx.state.events.push(researchNdaProposalRejectedEvent);
    }

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const getAccountProposals = async (ctx) => {
  const status = ctx.params.status;
  const username = ctx.params.username;

  try {
    const proposalsService = new ProposalService();
    let result = await proposalsService.getAccountProposals(username);
    result.sort(function (a, b) {
      return new Date(b.proposal.created_at) - new Date(a.proposal.created_at);
    });
    ctx.body = status && status != 0 ? result.filter(p => p.proposal.status == status) : result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getProposalById = async (ctx) => {
  const externalId = ctx.params.proposalExternalId;

  try {
    const proposalsService = new ProposalService();
    const result = await proposalsService.getProposal(externalId);
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
    createProposal,
    updateProposal,
    deleteProposal,
    getAccountProposals,
    getProposalById
}