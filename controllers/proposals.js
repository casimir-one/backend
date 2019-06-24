import { authorizeResearchGroup } from './../services/auth'
import { findResearchContentByHash, lookupContentProposal, proposalIsNotExpired } from './../services/researchContent'
import { sendProposalNotificationToGroup } from './../services/notifications';
import { sendTransaction, getTransaction } from './../utils/blockchain';
import deipRpc from '@deip/deip-rpc-client';

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
        rc.title = proposal.title;
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

export default {
    createResearchProposal,
    createContentProposal,
    createInviteProposal
}