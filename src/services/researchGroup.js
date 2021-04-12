import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import ResearchGroup from './../schemas/researchGroup';


class ResearchGroupService extends BaseReadModelService {

  constructor(options = { scoped: true }) { 
    super(ResearchGroup, options); 
  }

  async mapResearchGroups(researchGroups) {
    const chainResearchGroups = await deipRpc.api.getResearchGroupsAsync(researchGroups.map(r => r._id));
    const membershipTokens = await Promise.all(chainResearchGroups.map(rg => deipRpc.api.getResearchGroupMembershipTokensAsync(rg.external_id)));
    return chainResearchGroups
      .map((chainResearchGroup) => {
        const researchGroupMembershipTokens = membershipTokens.find(members => members[0] && members[0].research_group.external_id == chainResearchGroup.external_id);
        const members = researchGroupMembershipTokens ? researchGroupMembershipTokens.map(rgt => rgt.owner) : [];
        const researchGroupRef = researchGroups.find(r => r._id.toString() == chainResearchGroup.external_id);
        return { ...chainResearchGroup, tenantId: researchGroupRef ? researchGroupRef.tenantId : null, researchGroupRef: researchGroupRef ? { ...researchGroupRef, members } : null };
      })
      .map((researchGroup) => {
        const override = researchGroup.researchGroupRef ? { name: researchGroup.researchGroupRef.name, description: researchGroup.researchGroupRef.description } : { name: "Not specified", description: "Not specified" };
        return { ...researchGroup, ...override };
      });
  }


  async getResearchGroupsListing(personal) {
    const researchGroups = await this.findMany({});
    const result = await this.mapResearchGroups(researchGroups);
    if (!personal || personal === 'false') {
      return result.filter(rg => !rg.is_personal);
    }
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
    if (!researchGroups.length) return [];
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
      name,
      description
    });

    return result;
  }


  async authorizeResearchGroupAccount(account, member) {
    // TODO: check account authorities
    const rgts = await deipRpc.api.getResearchGroupTokensByAccountAsync(member);
    const rgt = rgts.find(rgt => rgt.research_group.external_id == account);
    if (!rgt) return null;
    const researchGroup = await this.getResearchGroup(rgt.research_group.external_id);
    return researchGroup;
  }


  async getResearchGroupsByUser(member) {
    const rgts = await deipRpc.api.getResearchGroupTokensByAccountAsync(member);
    const researchGroups = await this.getResearchGroups(rgts.map(rgt => rgt.research_group.external_id));
    return researchGroups;
  }

  async getResearchGroupsByTenant(tenantId) {
    const available = await this.findMany({});
    const researchGroups = available.filter(p => p.tenantId == tenantId);
    if (!researchGroups.length) return [];
    const result = await this.mapResearchGroups(researchGroups);
    return result;
  }

}

export default ResearchGroupService;