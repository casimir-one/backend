import ActivityLogEntry from './../schemas/activityLogEntry';
import deipRpc from '@deip/deip-oa-rpc-client';

async function findActivityLogsEntriesByResearchGroup(rgId) {
  let activityLogs = await ActivityLogEntry.find({ researchGroupId: rgId });
  return activityLogs;
}

async function createActivityLogEntry({
  researchGroupId,
  type,
  metadata
}) {

  let activityLogEntry = new ActivityLogEntry({
    researchGroupId,
    type,
    metadata
  });

  let savedActivityLogEntry = await activityLogEntry.save();
  return savedActivityLogEntry;
}


export default {
  findActivityLogsEntriesByResearchGroup,
  createActivityLogEntry
}

