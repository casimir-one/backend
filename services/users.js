import UserProfile from './../schemas/user';

async function findUserProfileByOwner(_id) {
  const userProfile = await UserProfile.findOne({ _id })
  return userProfile;
}

async function createUserProfile({
  username,
  email,
  firstName,
  lastName
}) {
  
  const userProfile = new UserProfile({
    _id: username,
    email: email,
    firstName: firstName,
    lastName: lastName
  });
  const savedUserProfile = await userProfile.save();

  return savedUserProfile;
}

export default {
  findUserProfileByOwner,
  createUserProfile
}