import deipRpc from '@deip/rpc-client';
import * as blockchainService from './../utils/blockchain';
import * as authService from './../services/auth'
import { USER_NOTIFICATION_TYPE, ACTIVITY_LOG_TYPE, USER_INVITE_STATUS } from './../constants';


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



const createExcludeProposal = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;
    const operation = tx['operations'][0];
    const payload = operation[1];

    const opGroupId = parseInt(payload.research_group_id);

    if (isNaN(opGroupId)) {
        ctx.status = 400;
        ctx.body = `Mallformed operation: "${operation}"`;
        return;
    }

    try {
        const authorized = await authorizeResearchGroup(opGroupId, jwtUsername);
        if (!authorized) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not a member of "${opGroupId}" group`
            return;
        }

        /* proposal specific action code */

        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            processNewProposalTx(payload, result.txInfo);
            ctx.status = 201;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }

    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}


// TODO: move this to chain/app event emmiter to forward specific events to event handlers (subscribers)
async function processNewProposalTx(payload, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === 'create_proposal' && opPayload.data === payload.data) {
            let proposals = await deipRpc.api.getProposalsByResearchGroupIdAsync(opPayload.research_group_id);
            let proposal = proposals.find(p => 
                    p.data === payload.data && 
                    p.creator === payload.creator && 
                    p.action === payload.action &&
                    p.expiration_time === payload.expiration_time);

            let parsedProposal = { ...proposal, data: JSON.parse(proposal.data), research_group_id: opPayload.research_group_id };
            
            userNotificationHandler.emit(USER_NOTIFICATION_TYPE.PROPOSAL, parsedProposal);
            researchGroupActivityLogHandler.emit(ACTIVITY_LOG_TYPE.PROPOSAL, parsedProposal);
            break;
        }
    }
}

export default {
    createExcludeProposal,
    createProposal,
    updateProposal,
    deleteProposal
}