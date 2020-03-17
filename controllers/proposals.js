import { authorizeResearchGroup } from './../services/auth'
import { findResearchContentByHash, lookupContentProposal, proposalIsNotExpired } from './../services/researchContent'
import { sendTransaction, getTransaction } from './../utils/blockchain';
import deipRpc from '@deip/deip-oa-rpc-client';
import UserNotification from './../schemas/userNotification';
import JoinRequest from './../schemas/joinRequest'
import researchService from './../services/research'
import researchGroupActivityLogHandler from './../event-handlers/researchGroupActivityLog';
import userNotificationHandler from './../event-handlers/userNotification';
import ACTIVITY_LOG_TYPE from './../constants/activityLogType';
import USER_NOTIFICATION_TYPE from './../constants/userNotificationType';

const voteForProposal = async (ctx) => {
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
            processProposalVoteTx(payload, result.txInfo);
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

const createContentProposal = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;
    const type = ctx.params.type;

    const operation = tx['operations'][0];
    const payload = operation[1];

    const proposal = JSON.parse(payload.data);
    const hash = type === 'dar' 
        ? proposal.content.slice(4) : type === 'file' 
        ? proposal.content.slice(5) : type === 'package' 
        ? proposal.content.slice(8) : null;

    const researchId = proposal.research_id;
    const opGroupId = parseInt(payload.research_group_id);

    if (!hash || isNaN(opGroupId)) {
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
        const rc = await findResearchContentByHash(researchId, hash);
        if (!rc) {
            ctx.status = 404;
            ctx.body = `Research content with hash "${hash}" does not exist`
            return;
        }
        if (rc.status != 'in-progress') {
            ctx.status = 409;
            ctx.body = `Research content "${rc.title}" has '${rc.status}' status`
            return;
        }

        const existingProposal = await lookupContentProposal(opGroupId, hash, type)
        if (existingProposal && proposalIsNotExpired(existingProposal)) {
            ctx.status = 409;
            ctx.body = `Proposal for content with hash '${hash}' already exists: ${existingProposal}`
            return;
        }

        rc.status = 'proposed';
        rc.authors = proposal.authors;
        rc.references = proposal.references;
        rc.title = proposal.title;
        const updatedRc = await rc.save();
        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            processNewProposalTx(payload, result.txInfo);
            ctx.status = 200;
            ctx.body = updatedRc;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }
    } catch(err) {
        console.log(err);
        const rollback = async (hash) => {
            const rc = await findResearchContentByHash(researchId, hash);
            rc.status = 'in-progress';
            await rc.save();
        }

        await rollback(hash);
        ctx.status = 500;
        ctx.body = err.message;
    }
}


const createResearchProposal = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const { tx, researchMeta } = ctx.request.body;
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

        const { permlink } = JSON.parse(payload.data);
        const existingProposal = await researchService.lookupResearchProposal(opGroupId, permlink);
        if (existingProposal) {
          console.log(existingProposal)
          ctx.status = 400;
          ctx.body = `Proposal or research already exists`;
          return;
        }

        await researchService.upsertResearch({
          researchGroupId: opGroupId,
          permlink,
          ...researchMeta,
        });

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

const createInviteProposal = async (ctx) => {
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

        const proposal = JSON.parse(payload.data);
        const joinRequests = await JoinRequest.find({ 'groupId': opGroupId, username: proposal.name, 'status': { $in: ['approved', 'pending'] } });

        for (let i = 0; i < joinRequests.length; i++) {
            const joinRequest = joinRequests[i];
            joinRequest.status = 'approved';
            await joinRequest.save();
        }

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

const createTokenSaleProposal = async (ctx) => {
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

// TODO: move this to chain/app event emmiter to forward specific events to event handlers (subscribers)
async function processProposalVoteTx(payload, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === 'vote_proposal' && opPayload.proposal_id == payload.proposal_id) {
            let proposal = await deipRpc.api.getProposalAsync(opPayload.proposal_id); 
            let parsedProposal = { ...proposal, data: JSON.parse(proposal.data), research_group_id: opPayload.research_group_id };
            
            researchGroupActivityLogHandler.emit(ACTIVITY_LOG_TYPE.PROPOSAL_VOTE, { voter: opPayload.voter, proposal: parsedProposal });

            // if proposal is completed - send notifications to all group members
            if (proposal && proposal.is_completed) {
                let count = await UserNotification.count({ 'type': USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, 'meta.id': proposal.id });
                // in case user votes for approved proposal we shouldn't send notifications second time
                if (!count) {
                    userNotificationHandler.emit(USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, parsedProposal);
                    researchGroupActivityLogHandler.emit(ACTIVITY_LOG_TYPE.PROPOSAL_ACCEPTED, parsedProposal);
                }
                break;
            }
        }
    }
}


export default {
    voteForProposal,
    createResearchProposal,
    createContentProposal,
    createInviteProposal,
    createTokenSaleProposal
}