import deipRpc from '@deip/rpc-client';
import UserProfile from './../schemas/user';
import USER_PROFILE_STATUS from './../constants/userProfileStatus';
import config from './../config';
import * as blockchainService from './../utils/blockchain';



async function mapUsers(chainAccounts) {
  const profiles = await UserProfile.find({ _id: { $in: chainAccounts.map(a => a.name) } });
  return chainAccounts
    .map((chainAccount) => {
      const profileRef = profiles.find(r => r._id == chainAccount.name);
      return { account: chainAccount, profile: profileRef ? profileRef.toObject() : null };
    });
}

async function getUserByEmail(email) {
  const profile = await UserProfile.findOne({ email: email });
  if (!profile) return null;

  const user = await getUser(profile._id);
  return user;
}

async function getUser(username) {
  const [chainAccount] = await deipRpc.api.getAccountsAsync([username]);
  if (!chainAccount) return null;

  const [result] = await mapUsers([chainAccount]);
  return result;
}

async function getUsers(usernames) {
  const chainAccounts = await deipRpc.api.getAccountsAsync(usernames);
  const result = await mapUsers(chainAccounts.filter(a => !!a));
  return result;
}

async function findUserProfileByOwner(username) {
  const userProfile = await UserProfile.findOne({ _id: username });
  return userProfile ? userProfile.toObject() : null;
}

async function findPendingUserProfiles() {
  const profiles = await UserProfile.find({ status: USER_PROFILE_STATUS.PENDING })
  return [...profiles.map(p => p.toObject())];
}

async function findActiveUserProfiles() {
  const profiles = await UserProfile.find({ status: USER_PROFILE_STATUS.APPROVED })
  return [...profiles.map(p => p.toObject())];;
}

async function deleteUserProfile(username) {
  const result = await UserProfile.deleteOne({ _id: username })
  return result;
}

async function findUserProfiles(accounts) {
  const profiles = await UserProfile.find({ '_id': { $in: accounts } });
  return [...profiles.map(p => p.toObject())];
}

async function findResearchGroupMembershipUsers(researchGroupExternalId) {
  const membershipTokens = await deipRpc.api.getResearchGroupMembershipTokensAsync(researchGroupExternalId);
  const chainAccounts = await deipRpc.api.getAccountsAsync(membershipTokens.map(rgt => rgt.owner));
  const result = await mapUsers(chainAccounts);
  return result;
}

async function createUserProfile({
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

  const userProfile = new UserProfile({
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

  const savedUserProfile = await userProfile.save();
  return savedUserProfile.toObject();
}

async function updateUserProfile(username, {
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

  const userProfile = await UserProfile.findOne({ _id: username });

  userProfile.status = status ? status : userProfile.status;
  userProfile.email = email ? email : userProfile.email;
  userProfile.firstName = firstName ? firstName : userProfile.firstName;
  userProfile.lastName = lastName ? lastName : userProfile.lastName;
  userProfile.category = category ? category : userProfile.category;
  userProfile.occupation = occupation ? occupation : userProfile.occupation;
  userProfile.phoneNumbers = phoneNumbers ? phoneNumbers : userProfile.phoneNumbers;
  userProfile.webPages = webPages ? webPages : userProfile.webPages;
  userProfile.location = location ? location : userProfile.location;
  userProfile.foreignIds = foreignIds ? foreignIds : userProfile.foreignIds;
  userProfile.bio = bio ? bio : userProfile.bio;
  userProfile.birthdate = birthdate ? birthdate : userProfile.birthdate;
  userProfile.education = education ? education : userProfile.education;
  userProfile.employment = employment ? employment : userProfile.employment;  
  userProfile.avatar = avatar ? avatar : userProfile.avatar;

  const updatedUserProfile = await userProfile.save();
  return updatedUserProfile.toObject();
}


async function createUserAccount({ username, pubKey }) {
  const registrar = config.blockchain.accountsCreator;
  const chainConfig = await deipRpc.api.getConfigAsync();
  const chainProps = await deipRpc.api.getChainPropertiesAsync();
  // const ratio = chainConfig['DEIP_CREATE_ACCOUNT_DELEGATION_RATIO'];
  // var fee = Asset.from(chainProps.account_creation_fee).multiply(ratio);

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

export default {
  getUser,
  getUsers,
  getUserByEmail,
  findUserProfileByOwner,
  findPendingUserProfiles,
  findActiveUserProfiles,
  findUserProfiles,
  findResearchGroupMembershipUsers,
  createUserAccount,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile
}