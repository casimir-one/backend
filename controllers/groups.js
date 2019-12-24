
import { sendTransaction, getTransaction } from './../utils/blockchain';
import activityLogEntriesService from './../services/activityLogEntry';
import USER_NOTIFICATION_TYPE from './../constants/userNotificationType';
import userNotificationHandler from './../event-handlers/userNotification';

import deipRpc from '@deip/deip-oa-rpc-client';

const createResearchGroup = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;
    const operation = tx['operations'][0];
    const payload = operation[1];

    try {

        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            processNewGroupTx(payload, result.txInfo)
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

const getResearchGroupActivityLogs = async (ctx) => {
    let jwtUsername = ctx.state.user.username;
    let researchGroupId = ctx.params.researchGroupId;
    // todo: add access validation
    try {
        let result = await activityLogEntriesService.findActivityLogsEntriesByResearchGroup(researchGroupId)
        ctx.status = 201;
        ctx.body = result;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

// TODO: move this to chain/app event emmiter to forward specific events to event handlers (subscribers)
async function processNewGroupTx(payload, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === 'create_research_group' && opPayload.permlink === payload.permlink) {
            const researchGroup = await deipRpc.api.getResearchGroupByPermlinkAsync(opPayload.permlink);
            for (let i = 0; i < opPayload.invitees.length; i++) {
                let invitee = opPayload.invitees[i];
                userNotificationHandler.emit(USER_NOTIFICATION_TYPE.INVITATION, { researchGroupId: researchGroup.id, invitee: invitee.account });
            }
            break;
        }
    }
}



export default {
    createResearchGroup,
    getResearchGroupActivityLogs
}