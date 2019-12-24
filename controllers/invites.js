import { sendTransaction, getTransaction } from './../utils/blockchain';
import researchGroupActivityLogHandler from './../event-handlers/researchGroupActivityLog';
import userNotificationHandler from './../event-handlers/userNotification';
import ACTIVITY_LOG_TYPE from './../constants/activityLogType';
import USER_NOTIFICATION_TYPE from './../constants/userNotificationType';

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
            processResolvedInviteTx(true, invite, result.txInfo);
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
            processResolvedInviteTx(false, invite, result.txInfo);
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

// TODO: move this to chain/app event emmiter to forward specific events to event handlers (subscribers)
async function processResolvedInviteTx(isApproved, invite, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    const payloadOpName = isApproved ? 'approve_research_group_invite' : 'reject_research_group_invite';
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === payloadOpName && opPayload.research_group_invite_id == invite.id) {
            userNotificationHandler.emit(isApproved ? USER_NOTIFICATION_TYPE.INVITATION_APPROVED : USER_NOTIFICATION_TYPE.INVITATION_REJECTED, invite);
            researchGroupActivityLogHandler.emit(isApproved ? ACTIVITY_LOG_TYPE.INVITATION_APPROVED : ACTIVITY_LOG_TYPE.INVITATION_REJECTED, invite);
            break;
        }
    }
}


export default {
    approveInvite,
    rejectInvite
}