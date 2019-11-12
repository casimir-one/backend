import { sendReviewMadeNotificationToGroup } from './../services/notifications'
import { sendTransaction, getTransaction } from './../utils/blockchain';
import deipRpc from '@deip/deip-oa-rpc-client';

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
        const content = await deipRpc.api.getResearchContentByIdAsync(payload.research_content_id);
        const research = await deipRpc.api.getResearchByIdAsync(content.research_id);

        if (rgtList.some(rgt => rgt.research_group_id == research.research_group_id)) {
            ctx.status = 405;
            ctx.body = `You are not permitted to post reviews for "${research.title}`
            return;
        }

        const result = await sendTransaction(tx);
        if (result.isSuccess) {
             await processPublishedReview(payload, result.txInfo);
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


async function processPublishedReview(payload, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === 'make_review' && 
            opPayload.author == payload.author && 
            opPayload.research_content_id == payload.research_content_id) {
                
            const reviews = await deipRpc.api.getReviewsByContentAsync(payload.research_content_id);
            const review = reviews.find(r => r.author == opPayload.author && r.content == opPayload.content);
            if (review) {
                await sendReviewMadeNotificationToGroup(review);
            }
            break;
        }
    }
}

export default {
    makeReview
}
