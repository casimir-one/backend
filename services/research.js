import deipRpc from '@deip/deip-oa-rpc-client';
import Research from './../schemas/research';

async function findResearchByPermlink({ researchGroupId, permlink }) {
  let research = await Research.findOne({
    researchGroupId: researchGroupId,
    permlink: permlink
  });
  return research;
}

async function upsertResearch({
  researchGroupId, 
  permlink, 
  milestones,
  videoSrc, 
  partners, 
  trl
}) {

  let research = await findResearchByPermlink({ researchGroupId, permlink })

  if (research) {
    research.milestones = milestones;
    research.videoSrc = videoSrc;
    research.partners = partners;
    research.trl = trl;
  } else {
    research = new Research({
      researchGroupId, 
      permlink, 
      milestones,
      videoSrc, 
      partners, 
      trl
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
  findResearchByPermlink,
  upsertResearch,
  lookupResearchProposal
}