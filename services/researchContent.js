import deipRpc from '@deip/deip-rpc-client';
import ResearchContent from './../schemas/researchContent';

export async function findContentByHashOrId(hashOrId) {
    const rc = await ResearchContent.findOne({ $or: [ { _id: hashOrId }, { hash: hashOrId } ] });
    return rc;
}

export async function lookupProposal(groupId, hash, type) {
    const proposals = await deipRpc.api.getProposalsByResearchGroupIdAsync(groupId);
    const content = proposals.filter(p => p.action == 10).find(p => {
        const data = JSON.parse(p.data);
        return data.content == `${type}:${hash}`;
    });
    return content;
}

export function proposalIsNotExpired(proposal) {
    const now = new Date();
    return proposal.is_completed || (new Date(`${proposal.expiration_time}Z`).getTime() > now.getTime());
}