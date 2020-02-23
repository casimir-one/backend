import deipRpc from '@deip/deip-oa-rpc-client';
import Research from './../schemas/research';

export async function upsertResearch({
  researchGroupId, permlink, milestones,
  videoSrc, partners, trl
}) {
  let research = await Research.findOne({
    researchGroupId, permlink
  });

  if (research) {
    research.milestones = milestones;
    research.videoSrc = videoSrc;
    research.partners = partners;
    research.trl = trl;
  } else {
    research = new Research({
      researchGroupId, permlink, milestones,
      videoSrc, partners, trl
    })
  }

  return research.save();
}

export async function lookupResearchProposal(groupId, permlink) {
  const proposals = await deipRpc.api.getProposalsByResearchGroupIdAsync(groupId);
  const research = proposals.filter(p => p.action === 1).find((p) => {
    const data = JSON.parse(p.data);
    
    return data.permlink === permlink;
  })
  return research;
}