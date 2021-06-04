import deipRpc from '@deip/rpc-client';
import { USER_PROFILE_STATUS } from '../../../constants';
import BaseService from '../../base/BaseService';
import UserSchema from './../../../schemas/UserSchema';

class UserDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(UserSchema, options);
  }

  async mapUsers(profiles) {
    const chainAccounts = await deipRpc.api.getAccountsAsync(profiles.map(p => p._id));
    const tenantProfile = await this.getTenantInstance();
    return chainAccounts
      .map((chainAccount) => {
        const profile = profiles.find((r) => r._id == chainAccount.name);
        const appModules = tenantProfile.settings.modules;
        const roleInfo = tenantProfile.settings.roles.find((appRole) => profile.roles.some((userRole) => appRole.role == userRole.role));
        return { username: chainAccount.name, tenantId: profile.tenantId, account: chainAccount, profile: { ...profile, modules: roleInfo && roleInfo.modules ? roleInfo.modules : appModules } };
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
    const membershipTokens = await deipRpc.api.getResearchGroupMembershipTokensAsync(teamId);
    const profiles = await this.findMany({ _id: { $in: [...membershipTokens.map(rgt => rgt.owner)] }, status: USER_PROFILE_STATUS.APPROVED });
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