import UserProfile from './../schemas/user';

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

async function updateStripeCustomerId(username, stripeCustomerId) {
  const profile = await findUserById(username);
  profile.stripeCustomerId = stripeCustomerId;
  const updatedProfile = await profile.save()
  return updatedProfile;
}


export default {
  findUserById,
  createUser,
  updateStripeCustomerId
}
