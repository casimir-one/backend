import { USER_PROFILE_STATUS } from '../../../constants';
import BaseService from '../../base/BaseService';
import UserSchema from './../../../schemas/UserSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import TeamService from '../write/TeamService';
import AssetService from './../write/AssetService';

const teamService = new TeamService()
const assetService = new AssetService()

class UserDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(UserSchema, options);
  }

  async mapUsers(profiles) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const chainAccounts = await chainApi.getAccountsAsync(profiles.map(p => p._id));
    const tenantProfile = await this.getTenantInstance();

    //temp solution
    const symbols = [];
    chainAccounts.forEach(({ balances }) => {
      balances.forEach(b => {
        const symbol = b.split(' ')[1];
        if (!symbols.includes(symbol)) {
          symbols.push(symbol);
        }
      })
    });
    const assetsList = await assetService.getAssetsBySymbols(symbols)
    return chainAccounts
      .map((chainAccount) => {
        const profile = profiles.find((r) => r._id == chainAccount.name);
        const appModules = tenantProfile.settings.modules;
        const roleInfo = tenantProfile.settings.roles.find((appRole) => profile.roles.some((userRole) => appRole.role == userRole.role));
        const roles = profile.roles.map(r => ({
          role: r.role,
          teamId: r.researchGroupExternalId
        }));
        const modules = roleInfo && roleInfo.modules ? roleInfo.modules : appModules;

        //temp solution
        const balances = chainAccount.balances.map(b => {
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
          username: chainAccount.name,
          entityId: chainAccount.name,
          pubKey: chainAccount.owner.key_auths[0][0],
          tenantId: profile.tenantId,
          account: {
            ...chainAccount,
            balances
          },
          attributes: profile.attributes,
          balances,
          ...profile,
          modules,
          roles,
          profile: {
            ...profile,
            modules,
            roles
          } };
      });
  }


  async getUserByEmail(email) {
    const profile = await this.findOne({ email: email, status: USER_PROFILE_STATUS.APPROVED });
    if (!profile) return null;
    const [result] = await this.mapUsers([profile]);
    return result;
  }


  async getUser(username) {
    const profile = await this.findOne({ _id: username, status: USER_PROFILE_STATUS.APPROVED });
    if (!profile) return null;
    const [result] = await this.mapUsers([profile]);
    return result;
  }


  async getUsers(usernames) {
    const profiles = await this.findMany({ _id: { $in: [...usernames] }, status: USER_PROFILE_STATUS.APPROVED });
    if (!profiles.length) return [];
    const result = await this.mapUsers(profiles);
    return result;
  }


  // TODO: Remove this
  async findUserProfileByOwner(username) {
    const profile = await this.findOne({ _id: username });
    return profile;
  }


  async findUserProfilesByStatus(status) {
    const profiles = await this.findMany({ status: status })
    return profiles;
  }


  async findUserProfiles(accounts) {
    const profiles = await this.findMany({ '_id': { $in: accounts } });
    return profiles;
  }


  async getUsersByTeam(teamId) {
    const team = await teamService.getTeam(teamId);
    if (!team) return [];
    const { members } = team;
    const profiles = await this.findMany({ _id: { $in: [...members] }, status: USER_PROFILE_STATUS.APPROVED });
    if (!profiles.length) return [];
    const result = await this.mapUsers(profiles);
    return result;
  }


  async getUsersByTenant(tenantId) {
    const available = await this.findMany({ status: USER_PROFILE_STATUS.APPROVED });
    const profiles = available.filter(p => p.tenantId == tenantId);
    if (!profiles.length) return [];
    const result = await this.mapUsers(profiles);
    return result;
  }

  
  async getUsersListing(status) {
    const profiles = await this.findMany({ status: status ? status : USER_PROFILE_STATUS.APPROVED });
    if (!profiles.length) return [];
    const result = await this.mapUsers(profiles);
    return result;
  }
}

export default UserDtoService;