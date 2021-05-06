import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import UserProfile from './../schemas/user';
import { USER_PROFILE_STATUS } from './../constants';
import config from './../config';
import * as blockchainService from './../utils/blockchain';


class UserService extends BaseReadModelService {

  constructor(scoped = true) {
    super(UserProfile, scoped); 
  }

  async mapUsers(profiles) {
    const chainAccounts = await deipRpc.api.getAccountsAsync(profiles.map(p => p._id));
    return chainAccounts
      .map((chainAccount) => {
        const profileRef = profiles.find(r => r._id == chainAccount.name);
        return { username: chainAccount.name, tenantId: profileRef ? profileRef.tenantId : null, account: chainAccount, profile: profileRef ? profileRef : null };
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
    birthdate
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
      tenant: tenant
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


  async createUserAccount({ username, pubKey }) {
    const registrar = config.FAUCET_ACCOUNT;
    // const chainConfig = await deipRpc.api.getConfigAsync();
    // const chainProps = await deipRpc.api.getChainPropertiesAsync();
    // const ratio = chainConfig['DEIP_CREATE_ACCOUNT_DELEGATION_RATIO'];
    // const fee = Asset.from(chainProps.account_creation_fee).multiply(ratio);

    const { username: regacc, fee, wif } = registrar;
    const owner = {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [[pubKey, 1]]
    };


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

    const signedTx = await blockchainService.signOperations([create_account_op], wif);
    const result = await blockchainService.sendTransactionAsync(signedTx);
    return result;
  }
  
}

export default UserService;