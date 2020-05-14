import deipRpc from '@deip/rpc-client';
import Research from './../schemas/research';

async function findResearchById(externalId) {
  let research = await Research.findOne({ _id: externalId });
  return research;
}

async function createResearch({
  externalId,
  researchGroupExternalId,
  researchGroupInternalId,
  permlink,
  milestones,
  videoSrc,
  partners,
  tenantCriterias,
}) {

  const research = new Research({
    _id: externalId,
    researchGroupExternalId,
    permlink,
    milestones,
    videoSrc,
    partners,
    tenantCriterias,
    researchGroupId: researchGroupInternalId, // legacy internal id
  });

  return research.save();
}

async function updateResearch(externalId, {
  milestones,
  videoSrc,
  partners,
  tenantCriterias
}) {

  const research = await findResearchById(externalId);
  research.milestones = milestones;
  research.videoSrc = videoSrc;
  research.partners = partners;
  research.tenantCriterias = tenantCriterias;

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
  createResearch,
  updateResearch,
  lookupResearchProposal
}