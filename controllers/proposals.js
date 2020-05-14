import deipRpc from '@deip/rpc-client';
import * as blockchainService from './../utils/blockchain';
import * as authService from './../services/auth'

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

const updateProposal = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: proposalId } = payload;

    const txResult = await blockchainService.sendTransactionAsync(tx);  
    const proposal = await deipRpc.api.getProposalAsync(proposalId);
    
    ctx.status = 200;
    ctx.body = { tx, txResult, isAprroved: proposal == null };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
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