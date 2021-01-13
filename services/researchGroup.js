import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import ResearchGroup from './../schemas/researchGroup';


class ResearchGroupService extends BaseReadModelService {

  constructor() { super(ResearchGroup); }

  async mapResearchGroups(researchGroups) {
    
    const chainResearchGroups = await deipRpc.api.getResearchGroupsAsync(researchGroups.map(r => r._id));
    return chainResearchGroups
      .map((chainResearchGroup) => {
        const researchGroupRef = researchGroups.find(r => r._id.toString() == chainResearchGroup.external_id);
        return { ...chainResearchGroup, researchGroupRef: researchGroupRef ? researchGroupRef : null };
      })
      .map((researchGroup) => {
        const override = researchGroup.researchGroupRef ? { name: researchGroup.researchGroupRef.name, description: researchGroup.researchGroupRef.description } : { name: "Not specified", description: "Not specified" };
        return { ...researchGroup, ...override };
      });
  }


  async lookupResearchGroups() {
    const researchGroups = await this.findMany();
    const result = await this.mapResearchGroups(researchGroups);
    return result;
  }


  async getResearchGroup(researchGroupExternalId) {
    const researchGroup = await this.findOne({ _id: researchGroupExternalId });
    if (!researchGroup) return null;
    const results = await this.mapResearchGroups([researchGroup]);
    const [result] = results;
    return result;
  }


  async getResearchGroups(researchGroupExternalIds) {
    const researchGroups = await this.findMany({ _id: { $in: [...researchGroupExternalIds] } });
    const result = await this.mapResearchGroups(researchGroups);
    return result;
  }


  async createResearchGroupRef({
    externalId,
    creator,
    name,
    description
  }) {

    const result = await this.createOne({
      _id: externalId,
      creator,
      name,
      description
    });

    return result;
  }


  async updateResearchGroupRef(externalId, {
    name,
    description
  }) {

    const result = this.updateOne({ _id: externalId }, {
      name: name ? name : undefined,
      description: description ? description : undefined
    });

    return result;
  }

}

export default ResearchGroupService;