import deipRpc from '@deip/deip-rpc-client';

export async function authorizeResearchGroup(groupId, username) {
    if (!isNaN(groupId)) {
        const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(username);
        return rgtList.some(rgt => rgt.research_group_id === groupId);
    } else {
        console.log.error(`Group Id is not provided for the authentication: ${groupId}`)
        return false;
    }
}