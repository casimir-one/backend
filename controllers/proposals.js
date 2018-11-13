import { authorizeResearchGroup } from './../services/auth'
import { findContentByHashOrId, lookupProposal, proposalIsNotExpired } from './../services/researchContent'
import { sendTransaction } from './../utils/blockchain';
import deipRpc from '@deip/deip-rpc-client';
import ResearchContent from './../schemas/researchContent';
import UserProfile from './../schemas/user';
import Notification from './../schemas/notification';
import JoinRequest from './../schemas/joinRequest'

const createContentProposal = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;
    const type = ctx.params.type;

    const operation = tx['operations'][0];
    const payload = operation[1];

    const proposal = JSON.parse(payload.data);
    const hash = type === 'dar' ? proposal.content.slice(4) : proposal.content.slice(5);
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

        const rc = await findContentByHashOrId(hash);
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

        const existingProposal = await lookupProposal(opGroupId, hash, type)
        if (existingProposal && proposalIsNotExpired(existingProposal)) {
            ctx.status = 409;
            ctx.body = `Proposal for content with hash '${hash}' already exists: ${existingProposal}`
            return;
        }

        rc.status = 'proposed';
        rc.authors = proposal.authors;
        rc.references = proposal.references;
        const updatedRc = await rc.save()
        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            await sendProposalNotificationToGroup(opGroupId, payload);
            ctx.status = 200;
            ctx.body = updatedRc;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }
    } catch(err) {
        console.log(err);
        const rollback = async (hash) => {
            const rc = await findContentByHashOrId(hash)
            rc.status = 'in-progress';
            await rc.save()
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
            await sendProposalNotificationToGroup(opGroupId, payload);
            ctx.status = 201;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }

    } catch (err) {
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
            await sendProposalNotificationToGroup(opGroupId, payload);
            ctx.status = 201;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }

    } catch (err) {
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
            await sendProposalNotificationToGroup(opGroupId, payload);
            ctx.status = 201;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }

    } catch (err) {
        ctx.status = 500;
        ctx.body = err.message;
    }
}


async function sendProposalNotificationToGroup(groupId, proposalOp) {
    const proposal = proposalOp;
    proposal.data = JSON.parse(proposal.data);
    const group = await deipRpc.api.getResearchGroupByIdAsync(groupId);
    const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(groupId);
    const notifications = [];
    for (let i = 0; i < rgtList.length; i++) {
        const rgt = rgtList[i];
        const creatorProfile = await UserProfile.findOne({'_id': proposal.creator});
        proposal.creatorInfo = creatorProfile;
        proposal.groupInfo = group;

        const notification = new Notification({
            username: rgt.owner,
            status: 'unread',
            type: 'proposal',
            meta: proposal
        });
        const savedNotification = await notification.save();
        notifications.push(savedNotification);
    }

    return notifications;
}


export default {
    createResearchProposal,
    createContentProposal,
    createInviteProposal,
    createTokenSaleProposal
}