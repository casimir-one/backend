import UserProfile from './../schemas/user';
import stripeService from './stripe';

async function findUserById(username) {
  const profile = await UserProfile.findOne({ '_id': username });
  return profile;
}

async function createUser({ username, email, firstName, lastName }) {
  const model = new UserProfile({
    _id: username,
    email: email,
    firstName: firstName,
    lastName: lastName,
    activeOrgPermlink: username
  });
  const profile = await model.save();
  return profile;
}

async function updateStripeInfo(username, stripeCustomerId, stripeSubscriptionId, stripePricingPlanId) {
  const profile = await findUserById(username);
  profile.stripeCustomerId = stripeCustomerId;
  profile.stripeSubscriptionId = stripeSubscriptionId;
  profile.stripePricingPlanId = stripePricingPlanId;
  const updatedProfile = await profile.save()
  return updatedProfile;
}

async function findUserByCustomerId(customerId) {
  const profile = await UserProfile.findOne({ 'stripeCustomerId': customerId });
  return profile;
}

async function findUserByEmail(email) {
  const profile = await UserProfile.findOne({ 'email': email });
  return profile;
}

async function updateProfile(username, profileToUpdate = {}) {
  const profile = await UserProfile.findOne({ '_id': username })
  if (!profile) {
    return null;
  }

  const prevEmail = profile.email;
  for (let key in profileToUpdate) {
    if (profileToUpdate.hasOwnProperty(key)) {
      profile[key] = profileToUpdate[key];
    }
  }

  const updatedProfile = await profile.save();
  if (updatedProfile.stripeCustomerId && updatedProfile.email !== prevEmail) {
    stripeService.updateCustomer(updatedProfile.stripeCustomerId, {
      email: updatedProfile.email
    }).catch(console.error)
  }

  return updatedProfile;
}

async function updateFreeUnits(username, {
  certificates, contracts, fileShares,
}) {
  const toSet = {};

  if (certificates !== undefined) {
    toSet['freeUnits.certificates'] = certificates;
  }
  if (contracts !== undefined) {
    toSet['freeUnits.contracts'] = contracts;
  }
  if (fileShares !== undefined) {
    toSet['freeUnits.fileShares'] = fileShares;
  }
  await UserProfile.updateOne({ _id: username }, {
    $set: toSet
  });
}

export default {
  findUserById,
  findUserByCustomerId,
  findUserByEmail,
  createUser,
  updateStripeInfo,
  updateProfile,
  updateFreeUnits
}
