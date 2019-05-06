import { authorizeResearchGroup } from './../services/auth'
import { findResearchContentByHash, lookupContentProposal, proposalIsNotExpired } from './../services/researchContent'
import { sendProposalNotificationToGroup } from './../services/notifications'
import { sendTransaction, getTransaction } from './../utils/blockchain';
import deipRpc from '@deip/deip-rpc-client';
import ResearchContent from './../schemas/researchContent';
import UserProfile from './../schemas/user';
import Notification from './../schemas/notification';
import JoinRequest from './../schemas/joinRequest'
import { fileURLToPath } from 'url';

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
            await processProposalVote(payload, result.txInfo);
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
            ctx.status = 405;
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
        const updatedRc = await rc.save();
        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            await processNewProposal(payload, result.txInfo);
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
            await processNewProposal(payload, result.txInfo);
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
            await processNewProposal(payload, result.txInfo);
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
            await processNewProposal(payload, result.txInfo);
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


async function processNewProposal(payload, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === 'create_proposal' && opPayload.data === payload.data) {
            const proposals = await deipRpc.api.getProposalsByResearchGroupIdAsync(opPayload.research_group_id);
            const proposal = proposals.find(p => 
                    p.data === payload.data && 
                    p.creator === payload.creator && 
                    p.action === payload.action &&
                    p.expiration_time === payload.expiration_time);

            if (proposal) {
                proposal.data = JSON.parse(proposal.data);
                await sendProposalNotificationToGroup(proposal);
            }
            break;
        }
    }
}

async function processProposalVote(payload, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === 'vote_proposal' && opPayload.proposal_id == payload.proposal_id) {
            const proposal = await deipRpc.api.getProposalAsync(opPayload.proposal_id);

            // if proposal is completed - send notifications to all group members
            if (proposal && proposal.is_completed) {
                proposal.data = JSON.parse(proposal.data);
                const count = await Notification.count({ 'type': 'completed-proposal', 'meta.id': proposal.id });
                // in case user votes for approved proposal we shouldn't send notifications second time
                if (!count) {
                    await sendProposalNotificationToGroup(proposal);
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