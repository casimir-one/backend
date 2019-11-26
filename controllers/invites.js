import { sendInviteResolvedNotificationToGroup } from './../services/notifications'
import { sendTransaction, getTransaction } from './../utils/blockchain';
import deipRpc from '@deip/deip-oa-rpc-client';

const approveInvite = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;

    const operation = tx['operations'][0];
    const payload = operation[1];
    
    if (payload.owner != jwtUsername) {
        ctx.status = 400;
        ctx.body = `Invite can be accepted only by "${jwtUsername} account`
        return;
    }

    try {
        const invite = await deipRpc.api.getResearchGroupInviteByIdAsync(payload.research_group_invite_id);
        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            await processResolvedInvite(true, invite, result.txInfo);
            ctx.status = 201;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }
    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}


const rejectInvite = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;

    const operation = tx['operations'][0];
    const payload = operation[1];
    
    if (payload.owner != jwtUsername) {
        ctx.status = 400;
        ctx.body = `Invite can be accepted only by "${jwtUsername} account`
        return;
    }

    try {
        const invite = await deipRpc.api.getResearchGroupInviteByIdAsync(payload.research_group_invite_id);
        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            await processResolvedInvite(false, invite, result.txInfo);
            ctx.status = 201;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }
    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}


async function processResolvedInvite(isApproved, invite, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    const payloadOpName = isApproved ? 'approve_research_group_invite' : 'reject_research_group_invite';
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === payloadOpName && opPayload.research_group_invite_id == invite.id) {
            await sendInviteResolvedNotificationToGroup(isApproved, invite)
            break;
        }
    }
}


export default {
    approveInvite,
    rejectInvite
}