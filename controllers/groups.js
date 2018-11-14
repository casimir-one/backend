
import { sendTransaction, getTransaction } from './../utils/blockchain';
import { sendInvitationNotificationToInvitee } from './../services/notifications';
import deipRpc from '@deip/deip-rpc-client';

const createResearchGroup = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;
    const operation = tx['operations'][0];
    const payload = operation[1];

    try {

        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            await processNewGroup(payload, result.txInfo)
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


async function processNewGroup(payload, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === 'create_research_group' && opPayload.permlink === payload.permlink) {
            const group = await deipRpc.api.getResearchGroupByPermlinkAsync(opPayload.permlink);
            if (group) {
                for (let i = 0; i < opPayload.invitees.length; i++) {
                    const invitee = opPayload.invitees[i];
                    await sendInvitationNotificationToInvitee(group.id, invitee.account);
                }
            }
            break;
        }
    }
}



export default {
    createResearchGroup
}