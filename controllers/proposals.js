import deipRpc from '@deip/rpc-client';
import * as blockchainService from './../utils/blockchain';
import { APP_EVENTS } from './../constants';
import UserTransactionsService from './../services/userTransactions';

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

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: proposalId } = payload;

    const proposal = await deipRpc.api.getProposalAsync(proposalId);
    if (!proposal) {
      ctx.status = 404;
      ctx.body = `Proposal for "${proposalId}" is not found`;
      return;
    }

    const txResult = await blockchainService.sendTransactionAsync(tx);  
    const updatedProposal = await deipRpc.api.getProposalAsync(proposalId);
    const isAccepted = updatedProposal == null;
    
    if (isAccepted) {
      ctx.state.events.push([APP_EVENTS.PROPOSAL_ACCEPTED, { tx: proposal.proposed_transaction, emitter: jwtUsername }]);

      const operations = blockchainService.extractOperations(proposal.proposed_transaction);
      
      // const inviteDatum = operations.find(([opName]) => opName == 'join_research_group_membership');
      // if (inviteDatum) {
      //   ctx.state.events.push([APP_EVENTS.USER_INVITATION_SIGNED, { opDatum: ['update_proposal', payload, null], context: { emitter: jwtUsername } }]);
      // }

      const researchDatum = operations.find(([opName]) => opName == 'create_research');
      if (researchDatum) {
        ctx.state.events.push([APP_EVENTS.RESEARCH_CREATED, { opDatum: researchDatum, context: { emitter: jwtUsername, offchainMeta: {} } }]);
      }

      const researchUpdateDatum = operations.find(([opName]) => opName == 'update_research');
      if (researchUpdateDatum) {
        ctx.state.events.push([APP_EVENTS.RESEARCH_UPDATED, { opDatum: researchUpdateDatum, context: { emitter: jwtUsername, offchainMeta: {} } }]);
      }

      const researchTokenSaleDatum = operations.find(([opName]) => opName == 'create_research_token_sale');
      if (researchTokenSaleDatum) {
        ctx.state.events.push([APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED, { opDatum: researchTokenSaleDatum, context: { emitter: jwtUsername, offchainMeta: {} } }]);
      }
    }

    ctx.status = 200;
    ctx.body = { tx, txResult, isAccepted };

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
  const userTransactionsService = new UserTransactionsService(tenant);

  try {
    let result = await userTransactionsService.getAccountProposals(username);
    ctx.body = status && status != 0 ? result.filter(p => p.proposal.status == status) : result;
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
    getAccountProposals
}