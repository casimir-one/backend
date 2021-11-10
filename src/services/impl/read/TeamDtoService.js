import BaseService from './../../base/BaseService';
import TeamSchema from './../../../schemas/TeamSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import AssetService from './../write/AssetService';

const assetService = new AssetService()

class TeamDtoService extends BaseService {
  constructor(options = { scoped: true }) { 
    super(TeamSchema, options);
  }

  async mapTeams(teams) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const chainTeams = await chainApi.getAccountsAsync(teams.map(rg => rg._id));

    //temp solution
    const symbols = [];
    chainTeams.forEach(({ balances }) => {
      balances.forEach(b => {
        const symbol = b.split(' ')[1];
        if (!symbols.includes(symbol)) {
          symbols.push(symbol);
        }
      })
    });
    const assetsList = await assetService.getAssetsBySymbols(symbols)

    return chainTeams
      .map((chainTeam) => {
        const teamRef = teams.find(r => r._id.toString() == chainTeam.name);

        //temp solution
        const balances = chainTeam.balances.map(b => {
          const [amount, symbol] = b.split(' ');
          const asset = assetsList.find((a) => symbol === a.symbol);
          return {
            id: asset._id,
            symbol,
            amount: `${Number(amount)}`,
            precision: asset.precision
          }
        });

        return { 
          external_id: chainTeam.name,
          entityId: chainTeam.name,
          attributes: teamRef.attributes,
          creator: teamRef.creator,
          is_dao: chainTeam.is_research_group,
          is_personal: !chainTeam.is_research_group,
          description: chainTeam.json_metadata,
          account: {
            ...chainTeam,
            balances
          },
          balances,
          tenantId: teamRef.tenantId,
          members: teamRef.members,
          researchGroupRef: teamRef
        }
      })
      .map((researchGroup) => {
        const override = researchGroup.researchGroupRef ? { name: researchGroup.researchGroupRef.name, description: researchGroup.researchGroupRef.description } : { name: "Not specified", description: "Not specified" };
        return { ...researchGroup, ...override };
      });
  }


  async getTeamsListing(withTenantTeam = false) {
    const teams = await this.findMany({ isTenantTeam: withTenantTeam });
    const result = await this.mapTeams(teams);
    return result;
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
    const { members } = team;
    return members.includes(member);
  }


  async getTeamsByUser(member, withTenantTeam = false) {
    const teams = await this.findMany({ members: { $in : [member] }, isTenantTeam: withTenantTeam })
    if (!teams.length) return [];
    const result = await this.mapTeams(teams);
    return result;
  }

  async getTeamsByTenant(tenantId, withTenantTeam = false) {
    const available = await this.findMany({ isTenantTeam: withTenantTeam });
    const teams = available.filter(p => p.tenantId == tenantId);
    if (!teams.length) return [];
    const result = await this.mapTeams(teams);
    return result;
  }

}

export default TeamDtoService;