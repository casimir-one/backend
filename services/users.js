import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import UserProfile from './../schemas/user';
import { USER_PROFILE_STATUS } from './../constants';
import config from './../config';
import * as blockchainService from './../utils/blockchain';


const rolesMap = {
  'admin': "3333333333333333333333333333333333333333",
  'team-member': "4444444444444444444444444444444444444444"
}

class UserService extends BaseReadModelService {

  constructor(scoped = true) {
    super(UserProfile, scoped);
  }

  async mapUsers(profiles) {
    const chainAccounts = await deipRpc.api.getAccountsAsync(profiles.map(p => p._id));
    const chainMembershipTokens = await Promise.all(chainAccounts.map(a => deipRpc.api.getResearchGroupTokensByAccountAsync(a.name)));
    const tenantProfile = await this.getTenantInstance();
    return chainAccounts
      .map((chainAccount) => {
        const profile = profiles.find((r) => r._id == chainAccount.name);
        const membershipTokens = chainMembershipTokens.find((teams) => teams.length && teams[0].owner == chainAccount.name) || [];
        const teams = membershipTokens.map((mt) => mt.research_group.external_id);
        const appModules = tenantProfile.settings.modules;
        const roleModules = tenantProfile.settings.roles.find((appRole) => profile.roles.some((userRole) => tenantProfile._id == userRole.researchGroupExternalId && appRole.role == userRole.role));
        return { username: chainAccount.name, tenantId: profile.tenantId, account: chainAccount, profile: { ...profile, modules: roleModules ? roleModules.modules : appModules }, teams };
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


  async deleteUserProfile(username) {
    const result = await this.deleteOne({ _id: username })
    return result;
  }


  async findUserProfiles(accounts) {
    const profiles = await this.findMany({ '_id': { $in: accounts } });
    return profiles;
  }


  async getUsersByResearchGroup(researchGroupExternalId) {
    const membershipTokens = await deipRpc.api.getResearchGroupMembershipTokensAsync(researchGroupExternalId);
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
  

  async createUserProfile({
    username,
    tenant,
    signUpPubKey,
    status,
    email,
    firstName,
    lastName,
    category,
    occupation,
    phoneNumbers,
    webPages,
    location,
    foreignIds,
    bio,
    birthdate,
    roles
  }) {

    const result = await this.createOne({
      _id: username,
      signUpPubKey: signUpPubKey,
      status: status,
      email: email,
      firstName: firstName,
      lastName: lastName,
      category: category,
      occupation: occupation,
      phoneNumbers: phoneNumbers,
      webPages: webPages,
      location: location,
      foreignIds: foreignIds,
      bio: bio,
      birthdate: birthdate,
      tenant: tenant,
      roles: roles
    });

    return result;
  }

  async updateUserProfile(username, {
    status,
    email,
    firstName,
    lastName,
    category,
    occupation,
    phoneNumbers,
    webPages,
    location,
    foreignIds,
    bio,
    birthdate,
    education,
    employment,
    avatar
  }) {

    const result = await this.updateOne({ _id: username }, {
      status,
      email,
      firstName,
      lastName,
      category,
      occupation,
      phoneNumbers,
      webPages,
      location,
      foreignIds,
      bio,
      birthdate,
      education,
      employment,
      avatar
    });

    return result;
  }

 
  async createUserAccount({ username, pubKey, role }) {
    const registrar = config.FAUCET_ACCOUNT;
    // const chainConfig = await deipRpc.api.getConfigAsync();
    // const chainProps = await deipRpc.api.getChainPropertiesAsync();
    // const ratio = chainConfig['DEIP_CREATE_ACCOUNT_DELEGATION_RATIO'];
    // const fee = Asset.from(chainProps.account_creation_fee).multiply(ratio);

    const ops = [];
    const { username: regacc, fee, wif: regaccPrivKey } = registrar;
    const owner = {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [[pubKey, 1]]
    };

    const refBlock = await blockchainService.getRefBlockSummary();

    const create_account_op = ['create_account', {
      fee: fee,
      creator: regacc,
      new_account_name: username,
      owner: owner,
      active: owner,
      active_overrides: [],
      memo_key: pubKey,
      json_metadata: undefined,
      traits: [],
      extensions: []
    }];

    ops.push(create_account_op);

    if (role) {
      await this._addUserRole(config.TENANT, username, role, refBlock, ops);
    }

    let signedTx = await blockchainService.signOperations(ops, regaccPrivKey, refBlock);
    if (role) {
      signedTx = deipRpc.auth.signTransaction(signedTx, { owner: config.TENANT_PRIV_KEY });
      // signedTx = await blockchainService.signOperations(ops, config.TENANT_PRIV_KEY, refBlock);
    }

    await blockchainService.sendTransactionAsync(signedTx);
    return signedTx;
  }


  async _addUserRole(inviter, invitee, role, refBlock, ops = []) {

    const roleResearchGroupId = rolesMap[role];
    if (!roleResearchGroupId) 
      return ops;

    const join_research_group_membership_op = ['join_research_group_membership', {
      member: invitee,
      research_group: roleResearchGroupId,
      reward_share: '0.00 %',
      researches: [],
      extensions: []
    }];

    const [proposal_external_id, create_proposal_op] = deipRpc.operations.createEntityOperation(['create_proposal', {
      creator: inviter,
      proposed_ops: [
        { "op": join_research_group_membership_op }
      ],
      expiration_time: new Date(new Date().getTime() + 86400000 * 365 * 3).toISOString().split('.')[0], // 3 years
      review_period_seconds: undefined,
      extensions: []
    }], refBlock);

    const update_proposal_op = ['update_proposal', {
      external_id: proposal_external_id,
      active_approvals_to_add: [inviter],
      active_approvals_to_remove: [],
      owner_approvals_to_add: [],
      owner_approvals_to_remove: [],
      key_approvals_to_add: [],
      key_approvals_to_remove: [],
      extensions: []
    }];

    ops.push(...[create_proposal_op, update_proposal_op]);

    return ops;
  }

  hasRole(user, role, tenantId = config.TENANT) {
    return user.profile.roles
      .some((userRole) => tenantId == userRole.researchGroupExternalId && role == userRole.role);
  }
  
}

export default UserService;