import ResearchGroup from './../schemas/researchGroup';
import deipRpc from '@deip/rpc-client';


class ResearchGroupService {

  constructor() { }

  async mapResearchGroups(chainResearchGroups) {
    const researchGroups = await ResearchGroup.find({ _id: { $in: chainResearchGroups.map(r => r.external_id) } });
    return chainResearchGroups
      .map((chainResearchGroup) => {
        const researchGroupRef = researchGroups.find(r => r._id.toString() == chainResearchGroup.external_id);
        return { ...chainResearchGroup, researchGroupRef: researchGroupRef ? researchGroupRef.toObject() : null };
      })
      .map((researchGroup) => {
        const override = researchGroup.researchGroupRef ? { name: researchGroup.researchGroupRef.name, description: researchGroup.researchGroupRef.description } : { name: "Not specified", description: "Not specified" };
        return { ...researchGroup, ...override };
      });
  }

  async getResearchGroup(researchGroupExternalId) {
    const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
    if (!chainResearchGroup) return null;
    const result = await this.mapResearchGroups([chainResearchGroup]);
    const [researchGroup] = result;
    return researchGroup;
  }

  async getResearchGroups(researchGroupExternalIds) {
    const chainResearchGroups = await deipRpc.api.getResearchGroupsAsync(researchGroupExternalIds);
    const researchGroups = await this.mapResearchGroups(chainResearchGroups);
    return researchGroups;
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
    creator,
    name,
    description
  }) {

    const researchGroup = new ResearchGroup({
      _id: externalId,
      creator,
      name,
      description
    });

    const savedResearchGroup = await researchGroup.save();
    return savedResearchGroup.toObject();
  }
  
  async updateResearchGroupRef(externalId, {
    name,
    description
  }) {

    const researchGroup = await ResearchGroup.findOne({ _id: externalId });

    researchGroup.name = name || researchGroup.name;
    researchGroup.description = description || researchGroup.description;
    
    const updatedResearchGroup = await researchGroup.save();
    return updatedResearchGroup.toObject();
  }

}

export default ResearchGroupService;