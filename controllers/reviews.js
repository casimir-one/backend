import { sendTransaction, getTransaction } from './../utils/blockchain';
import ReviewRequest from './../schemas/reviewRequest';
import researchGroupActivityLogHandler from './../event-handlers/researchGroupActivityLog';
import userNotificationHandler from './../event-handlers/userNotification';
import ACTIVITY_LOG_TYPE from './../constants/activityLogType';
import deipRpc from '@deip/rpc-client';
import USER_NOTIFICATION_TYPE from '../constants/userNotificationType';

const makeReview = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;

    const operation = tx['operations'][0];
    const payload = operation[1];
    
    if (payload.author != jwtUsername) {
        ctx.status = 403;
        ctx.body = `You are not authorized as "${payload.author} account`
        return;
    }

    try {
        const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(payload.author); 
        const content = await deipRpc.api.getResearchContentAsync(payload.research_content_external_id);
        const research = await deipRpc.api.getResearchByIdAsync(content.research_id);

        if (rgtList.some(rgt => rgt.research_group_id == research.research_group_id)) {
            ctx.status = 405;
            ctx.body = `You are not permitted to post reviews for "${research.title}`
            return;
        }

        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            processPublishedReviewTx(payload, result.txInfo);
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
async function processPublishedReviewTx(payload, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === 'make_review' && 
            opPayload.author == payload.author && 
            opPayload.research_content_id == payload.research_content_id) {
                
            let reviews = await deipRpc.api.getReviewsByResearchContentAsync(payload.research_content_id);
            let review = reviews.find(r => r.author == opPayload.author && r.content == opPayload.content);
            
            // todo move to event handler
            ReviewRequest.update({ expert: payload.author, contentId: payload.research_content_id }, { $set: { status: 'approved' } });
            
            userNotificationHandler.emit(USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW, review);
            researchGroupActivityLogHandler.emit(ACTIVITY_LOG_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW, review);
            break;
        }
    }
}

export default {
    makeReview
}
