import deipRpc from '@deip/deip-rpc-client';

async function authorizeResearchGroup(groupId, username) {
  if (groupId != null) {
    const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(username);
    return rgtList.some(rgt => rgt.research_group_id == groupId);
  } else {
    console.log.error(`Group Id is not provided for the authentication: ${groupId}`)
    return false;
  }
}

export {
  authorizeResearchGroup
}