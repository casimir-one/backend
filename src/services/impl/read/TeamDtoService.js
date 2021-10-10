import BaseService from './../../base/BaseService';
import TeamSchema from './../../../schemas/TeamSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';


class TeamDtoService extends BaseService {
  constructor(options = { scoped: true }) { 
    super(TeamSchema, options);
  }

  async mapTeams(researchGroups) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const chainResearchGroups = await chainApi.getAccountsAsync(researchGroups.map(rg => rg._id));

    return chainResearchGroups
      .map((chainResearchGroup) => {
        const researchGroupRef = researchGroups.find(r => r._id.toString() == chainResearchGroup.name);
        return { 
          external_id: chainResearchGroup.name,
          entityId: chainResearchGroup.name,
          attributes: researchGroupRef.attributes,
          creator: researchGroupRef.creator,
          is_dao: chainResearchGroup.is_research_group,
          is_personal: !chainResearchGroup.is_research_group,
          description: chainResearchGroup.json_metadata,
          account: chainResearchGroup, 
          tenantId: researchGroupRef.tenantId,
          members: researchGroupRef.members,
          researchGroupRef
        }
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
    const team = await this.findOne({ _id: account });
    const { members } = team;
    return members.includes(member);
  }


  async getTeamsByUser(member) {
    const teams = await this.findMany({ members: { $in : [member] } })
    if (!teams.length) return [];
    const result = await this.mapTeams(teams);
    return result;
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