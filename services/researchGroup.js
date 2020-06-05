import ResearchGroup from './../schemas/researchGroup';

async function findResearchGroupById(externalId) {
  let researchGroup = await ResearchGroup.findOne({ _id: externalId });
  return researchGroup;
}

async function createResearchGroup({
  externalId,
  creator
}) {

  let researchGroup = await findResearchGroupById(externalId);
  if (researchGroup) {
  } else {
    researchGroup = new ResearchGroup({
      _id: externalId,
      creator
    })
  }

  return researchGroup.save();
}


export default {
  findResearchGroupById,
  createResearchGroup
}