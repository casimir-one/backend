import deipRpc from '@deip/rpc-client';
import Research from './../schemas/research';

async function findResearchByPermlink({ permlink }) {
  let research = await Research.findOne({ permlink: permlink });
  return research;
}

async function findResearchById(externalId) {
  let research = await Research.findOne({ _id: externalId });
  return research;
}

async function removeResearchByPermlink(permlink) {
  let result = await Research.deleteOne({ permlink });
  return result;
}

async function upsertResearch({
  externalId,
  researchGroupExternalId,
  permlink, 
  milestones,
  videoSrc, 
  partners, 
  trl,
  researchGroupInternalId
}) {

  let research = await findResearchById(externalId);

  if (research) {
    research.researchGroupExternalId = researchGroupExternalId;
    research.permlink = permlink;
    research.milestones = milestones;
    research.videoSrc = videoSrc;
    research.partners = partners;
    research.trl = trl;
    research.researchGroupId = researchGroupInternalId; // legacy internal id
  } else {
    research = new Research({
      _id: externalId,
      researchGroupExternalId,
      permlink, 
      milestones,
      videoSrc, 
      partners, 
      trl,
      researchGroupId: researchGroupInternalId, // legacy internal id
    })
  }

  return research.save();
}

async function lookupResearchProposal(groupId, permlink) {
  const proposals = await deipRpc.api.getProposalsByResearchGroupIdAsync(groupId);
  const research = proposals.filter(p => p.action === 1).find((p) => {
    const data = JSON.parse(p.data);

    return data.permlink === permlink;
  })
  return research;
}

export default {
  findResearchById,
  findResearchByPermlink,
  removeResearchByPermlink,
  upsertResearch,
  lookupResearchProposal
}