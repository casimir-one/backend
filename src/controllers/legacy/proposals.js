import * as blockchainService from './../../utils/blockchain';
import { APP_PROPOSAL } from '@deip/constants';
import ProposalDtoService from './../../services/impl/read/ProposalDtoService';

import ResearchContentProposalSignedEvent from './../../events/legacy/researchContentProposalSignedEvent';
import ResearchExpressLicenseProposalSignedEvent from './../../events/legacy/researchExpressLicenseProposalSignedEvent';
import UserResignationProposalSignedEvent from './../../events/legacy/userResignationProposalSignedEvent';
import ResearchNdaProposalSignedEvent from './../../events/legacy/researchNdaProposalSignedEvent'

import ResearchContentProposalRejectedEvent from './../../events/legacy/researchContentProposalRejectedEvent';
import ResearchExpressLicenseProposalRejectedEvent from './../../events/legacy/researchExpressLicenseProposalRejectedEvent';
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

    const proposalDtoService = new ProposalDtoService();
    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: proposalId } = payload;
  
    await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);
    const updatedProposal = await proposalDtoService.getProposal(proposalId);


    if (updatedProposal.type == APP_PROPOSAL.PROJECT_CONTENT_PROPOSAL) { // wip
      const researchContentProposalSignedEvent = new ResearchContentProposalSignedEvent(datums);
      ctx.state.events.push(researchContentProposalSignedEvent);
    }

    if (updatedProposal.type == APP_PROPOSAL.EXPRESS_LICENSE_PROPOSAL) {
      const researchExpressLicenseProposalSignedEvent = new ResearchExpressLicenseProposalSignedEvent(datums);
      ctx.state.events.push(researchExpressLicenseProposalSignedEvent);
    }

    if (updatedProposal.type == APP_PROPOSAL.PROJECT_LEAVE_PROPOSAL) {
      const userResignationProposalSignedEvent = new UserResignationProposalSignedEvent(datums);
      ctx.state.events.push(userResignationProposalSignedEvent);
    }

    if (updatedProposal.type == APP_PROPOSAL.PROJECT_NDA_PROPOSAL) {
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

    const proposalDtoService = new ProposalDtoService();
    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: proposalId } = payload;

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const deletedProposal = await proposalDtoService.getProposal(proposalId);


    if (deletedProposal.type == APP_PROPOSAL.PROJECT_CONTENT_PROPOSAL) { // wip
      const researchContentProposalRejectedEvent = new ResearchContentProposalRejectedEvent(datums);
      ctx.state.events.push(researchContentProposalRejectedEvent);
    }

    if (deletedProposal.type == APP_PROPOSAL.EXPRESS_LICENSE_PROPOSAL) {
      const researchExpressLicenseProposalRejectedEvent = new ResearchExpressLicenseProposalRejectedEvent(datums);
      ctx.state.events.push(researchExpressLicenseProposalRejectedEvent);
    }

    if (deletedProposal.type == APP_PROPOSAL.PROJECT_LEAVE_PROPOSAL) {
      const userResignationProposalRejectedEvent = new UserResignationProposalRejectedEvent(datums);
      ctx.state.events.push(userResignationProposalRejectedEvent);
    }

    if (deletedProposal.type == APP_PROPOSAL.PROJECT_NDA_PROPOSAL) {
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
    const proposalDtoService = new ProposalDtoService();
    let result = await proposalDtoService.getAccountProposals(username);
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
    const proposalDtoService = new ProposalDtoService();
    const result = await proposalDtoService.getProposal(externalId);
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