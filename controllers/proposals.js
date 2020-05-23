import deipRpc from '@deip/rpc-client';
import * as blockchainService from './../utils/blockchain';
import { APP_EVENTS } from './../constants';

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
    
    ctx.status = 200;
    ctx.body = { tx, txResult, isAccepted };

    if (isAccepted) {
      ctx.state.events.push([APP_EVENTS.PROPOSAL_ACCEPTED, { tx: proposal.proposed_transaction, emitter: jwtUsername }]);
    }

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const deleteProposal = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    console.log(tx)

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: proposalId } = payload;

    const txResult = await blockchainService.sendTransactionAsync(tx);
    // TODO: remove model

    ctx.status = 200;
    ctx.body = { tx, txResult };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
    createProposal,
    updateProposal,
    deleteProposal
}