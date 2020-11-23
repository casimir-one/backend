import deipRpc from '@deip/rpc-client';
import * as blockchainService from './../utils/blockchain';
import { APP_EVENTS, PROPOSAL_STATUS, SMART_CONTRACT_TYPE } from './../constants';
import ResearchService from './../services/research';
import ProposalService from './../services/proposal';
import ResearchGroupService from './../services/researchGroup';
import usersService from './../services/users';
import ResearchProposalSignedEvent from './../events/researchProposalSignedEvent';
import ResearchUpdateProposalSignedEvent from './../events/researchUpdateProposalSignedEvent';
import ResearchContentProposalSignedEvent from './../events/researchContentProposalSignedEvent';
import ResearchTokenSaleProposalSignedEvent from './../events/researchTokenSaleProposalSignedEvent';
import ResearchGroupUpdateProposalSignedEvent from './../events/researchGroupUpdateProposalSignedEvent';
import AssetTransferProposalSignedEvent from './../events/assetTransferProposalSignedEvent';
import AssetExchangeProposalSignedEvent from './../events/assetExchangeProposalSignedEvent';
import ResearchExpressLicenseProposalSignedEvent from './../events/researchExpressLicenseProposalSignedEvent';


const createProposal = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
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
  const tenant = ctx.state.tenant;
  const { tx } = ctx.request.body;

  try {

    const researchGroupService = new ResearchGroupService();
    const researchService = new ResearchService(tenant);
    const proposalsService = new ProposalService(usersService, researchGroupService, researchService);

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: proposalId } = payload;


    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const updatedProposal = await proposalsService.getProposal(proposalId);
    const isAccepted = updatedProposal.proposal.status == PROPOSAL_STATUS.APPROVED;
    if (isAccepted) {

      // const inviteDatum = operations.find(([opName]) => opName == 'join_research_group_membership');
      // if (inviteDatum) {
      //   ctx.state.events.push([APP_EVENTS.USER_INVITATION_SIGNED, { opDatum: ['update_proposal', payload, null], context: { emitter: jwtUsername } }]);
      // }


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
  const tenant = ctx.state.tenant;
  const { tx } = ctx.request.body;

  try {

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: proposalId } = payload;

    const deletedProposal = await deipRpc.api.getProposalAsync(proposalId);
    const txResult = await blockchainService.sendTransactionAsync(tx);

    // TODO: move to handlers
    // const operations = blockchainService.extractOperations(deletedProposal.proposed_transaction);
    // const inviteDatum = operations.find(([opName]) => opName == 'join_research_group_membership');
    // if (inviteDatum) {
    //   ctx.state.events.push([APP_EVENTS.USER_INVITATION_CANCELED, { opDatum: ['delete_proposal', payload, null], context: { emitter: jwtUsername } }]);
    // }

    ctx.status = 200;
    ctx.body = payload;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const getAccountProposals = async (ctx) => {
  const tenant = ctx.state.tenant;
  const status = ctx.params.status;
  const username = ctx.params.username;

  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService(tenant);
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);

  try {
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
  const tenant = ctx.state.tenant;
  const externalId = ctx.params.proposalExternalId;

  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService(tenant);
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);

  try {
    let result = await proposalsService.getProposal(externalId);
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