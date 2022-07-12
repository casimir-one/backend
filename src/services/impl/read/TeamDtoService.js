import BaseService from './../../base/BaseService';
import TeamSchema from './../../../schemas/TeamSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';


class TeamDtoService extends BaseService {
  constructor(options = { scoped: true }) {
    super(TeamSchema, options);
  }

  async mapTeams(teams) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const chainBalances = await Promise.all(teams.map(team => chainRpc.getFungibleTokenBalancesByOwnerAsync(team._id)));

    return teams.map((team) => {
      const teamBalances = chainBalances.flat().filter((chainBalance) => chainBalance && chainBalance.account === team._id);

      return {
        _id: team._id,
        portalId: team.portalId,
        attributes: team.attributes,
        creator: team.creator,
        balances: teamBalances,
        members: team.members,
        address: team.address,
        name: team.name || "",
        description: team.description || "",
        createdAt: team.createdAt || team.created_at,
        updatedAt: team.updatedAt || team.updated_at
      }
    });
  }


  async getTeamsListing(withPortalTeam = false) {
    const teams = await this.findMany({ isPortalTeam: withPortalTeam });
    const result = await this.mapTeams(teams);
    return result;
  }


  async lookupTeamsPaginated(filter, sort, pagination) {
    if(!filter.isPortalTeam) filter.isPortalTeam = false;

    const { paginationMeta, result: teams } = await this.findManyPaginated(filter, sort, pagination);

    const result = await this.mapTeams(teams);
    return { paginationMeta, result };
  }


  async getTeam(teamId) {
    const team = await this.findOne({ _id: teamId });
    if (!team) return null;
    const results = await this.mapTeams([team]);
    const [result] = results;
    return result;
  }


  async getTeams(teamsIds) {
    const teams = await this.findMany({ _id: { $in: [...teamsIds] } });
    if (!teams.length) return [];
    const result = await this.mapTeams(teams);
    return result;
  }

  async authorizeTeamAccount(account, member) {
    const team = await this.findOne({ _id: account });
    if (team) {
      const { members } = team;
      return members.includes(member);
    }
    return false;
  }


  async getTeamsByUser(member, withPortalTeam = false) {
    const teams = await this.findMany({ members: { $in : [member] }, isPortalTeam: withPortalTeam })
    if (!teams.length) return [];
    const result = await this.mapTeams(teams);
    return result;
  }

  async getTeamsByPortal(portalId, withPortalTeam = false) {
    const available = await this.findMany({ isPortalTeam: withPortalTeam });
    const teams = available.filter(p => p.portalId == portalId);
    if (!teams.length) return [];
    const result = await this.mapTeams(teams);
    return result;
  }

}

export default TeamDtoService;
