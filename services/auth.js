import deipRpc from '@deip/rpc-client';

async function authorizeResearchGroup(groupId, username) {
    if (!isNaN(groupId)) {
        const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(username);
        return rgtList.some(rgt => rgt.research_group_id == groupId);
    } else {
        console.log.error(`Group Id is not provided for the authentication: ${groupId}`)
        return false;
    }
}

async function authorizeResearchGroupAccount(account, member) {
  // TODO: add checks for account keys
  const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(member);
  const rgt = rgtList.find(rgt => rgt.research_group.external_id == account);
  if (!rgt) return null;
  const researchGroup = await deipRpc.api.getResearchGroupByIdAsync(rgt.research_group_id);
  return researchGroup;
}

export {
  authorizeResearchGroup,
  authorizeResearchGroupAccount
}