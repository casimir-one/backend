import deipRpc from '@deip/rpc-client';
import BaseService from './../../base/BaseService';
import TeamSchema from './../../../schemas/TeamSchema';


class TeamDtoService extends BaseService {
  constructor(options = { scoped: true }) { 
    super(TeamSchema, options);
  }

  async mapTeams(researchGroups) {
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


  async getTeamsListing(personal) {
    const teams = await this.findMany({});
    const result = await this.mapTeams(teams);
    if (!personal || personal === 'false') {
      return result.filter(rg => !rg.is_personal);
    }
    return result;
  }


  async getTeam(teamId) {
    const team = await this.findOne({ _id: teamId });
    if (!team) return null;
    const results = await this.mapTeams([team]);
    const [result] = results;
    return result;
  }


  async getTeams(teamIds) {
    const teams = await this.findMany({ _id: { $in: [...teamIds] } });
    if (!teams.length) return [];
    const result = await this.mapTeams(teams);
    return result;
  }

  async authorizeTeamAccount(account, member) {
    // TODO: check account authorities
    const rgts = await deipRpc.api.getResearchGroupTokensByAccountAsync(member);
    const rgt = rgts.find(rgt => rgt.research_group.external_id == account);
    if (!rgt) return null;
    const team = await this.getTeam(rgt.research_group.external_id);
    return team;
  }


  async getTeamsByUser(member) {
    const rgts = await deipRpc.api.getResearchGroupTokensByAccountAsync(member);
    const teams = await this.getTeams(rgts.map(rgt => rgt.research_group.external_id));
    return teams;
  }

  async getTeamsByTenant(tenantId) {
    const available = await this.findMany({});
    const teams = available.filter(p => p.tenantId == tenantId);
    if (!teams.length) return [];
    const result = await this.mapTeams(teams);
    return result;
  }

}

export default TeamDtoService;