import ResearchGroup from './../schemas/researchGroup';
import deipRpc from '@deip/rpc-client';


class ResearchGroupService {

  constructor() { }

  async mapResearchGroups(chainResearchGroups) {
    const researchGroups = await ResearchGroup.find({ _id: { $in: chainResearchGroups.map(r => r.external_id) } });
    return chainResearchGroups
      .map((chainResearchGroup) => {
        const researchGroupRef = researchGroups.find(r => r._id == chainResearchGroup.external_id);
        return { ...chainResearchGroup, researchGroupRef: researchGroupRef ? researchGroupRef.toObject() : null };
      });
  }

  async getResearchGroup(researchGroupExternalId) {
    const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
    if (!chainResearchGroup) return null;
    const result = await this.mapResearchGroups([chainResearchGroup]);
    const [researchGroup] = result;
    return researchGroup;
  }

  async lookupResearchGroups(lowerBound, limit) {
    const chainResearchGroups = await deipRpc.api.lookupResearchGroupsAsync(lowerBound, limit);
    const result = await this.mapResearchGroups(chainResearchGroups);
    return result;
  }

  async findResearchGroupRef(externalId) {
    let researchGroup = await ResearchGroup.findOne({ _id: externalId });
    return researchGroup;
  }

  async createResearchGroupRef({
    externalId,
    creator
  }) {

    const researchGroup = new ResearchGroup({
      _id: externalId,
      creator
    });

    const savedResearchGroup = await researchGroup.save();
    return savedResearchGroup.toObject();
  }
  
}

export default ResearchGroupService;