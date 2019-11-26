import UserBookmark from './../schemas/userBookmark'
import UserProfile from './../schemas/user'
import qs from 'qs'

const getUserProfile = async (ctx) => {
    const username = ctx.params.username;
    const profile = await UserProfile.findOne({'_id': username})

    if (!profile) {
        ctx.status = 204;
        ctx.body = null;
        return;
    }

    ctx.status = 200;
    ctx.body = profile;
}


const getUsersProfiles = async (ctx) => {
    const query = qs.parse(ctx.query);
    const parsed = query.accounts || [];
    const accounts = [];

    if(Array.isArray(parsed)) {
        accounts.push(...parsed)
    } else if (typeof parsed === 'object' && parsed != null) {
        accounts.push(...Object.values(parsed))
    }

    const profiles = await UserProfile.find({'_id': { $in: accounts }})

    ctx.status = 200;
    ctx.body = profiles;
}

const createUserProfile = async (ctx) => {
    const data = ctx.request.body;
    const username = ctx.params.username;
    const jwtUsername = ctx.state.user.username;

    if (username != jwtUsername) { // revise this once we've got 'approve' operation working
        ctx.status = 403;
        ctx.body = `You have no permission to create '${username}' profile`
        return;
    }
    
    const exists = await UserProfile.count({'_id': username}) != 0;

    if (exists) {
        ctx.status = 409
        ctx.body = `Profile for "${username}" already exists!`
        return;
    }

    data._id = username;
    const profile = new UserProfile(data)
    const savedProfile = await profile.save()

    ctx.status = 200
    ctx.body = savedProfile
}


const updateUserProfile = async (ctx) => {
    const data = ctx.request.body;
    const username = ctx.params.username;
    const jwtUsername = ctx.state.user.username;

    if (username != jwtUsername) {
        ctx.status = 403;
        ctx.body = `You have no permission to edit '${username}' profile`
        return;
    }

    const profile = await UserProfile.findOne({'_id': username})

    if (!profile) {
        ctx.status = 404;
        ctx.body = `Profile for "${username}" does not exist!`
        return;
    }

    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            profile[key] = data[key] 
        }
    }
 
    const updatedProfile = await profile.save()
    ctx.status = 200;
    ctx.body = updatedProfile
}

const getUserBookmarks = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  if (username !== jwtUsername) {
    ctx.status = 403;
    ctx.body = `You have no permission to get '${username}' bookmarks`;
    return;
  }

  const query = {
    username,
  };
  if (ctx.query.type) {
    query.type = ctx.query.type;
  }
  if (ctx.query.ref) {
    query.ref = ctx.query.ref;
  }
  const bookmarks = await UserBookmark.find(query);

  ctx.status = 200;
  ctx.body = bookmarks;
}

const addUserBookmark = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  if (username !== jwtUsername) {
    ctx.status = 403;
    ctx.body = `You have no permission to create '${username}' bookmarks`;
    return;
  }

  const data = ctx.request.body;

  const bookmarkType = data.type;
  let ref
  switch (bookmarkType) {
    case 'research':
      const researchId = +data.researchId;
      if (!Number.isInteger(researchId) || researchId < 0) {
        ctx.status = 400;
        ctx.body = 'Invalid researchId value';
        return;
      }
      ref = data.researchId;
      break;
  }

  const bookmark = new UserBookmark({
    username,
    type: data.type,
    ref,
  });
  const savedBookmark = await bookmark.save();

  ctx.status = 201;
  ctx.body = savedBookmark;
}

const removeUserBookmark = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  if (username !== jwtUsername) {
    ctx.status = 403;
    ctx.body = `You have no permission to remove '${username}' bookmarks`;
    return;
  }

  await UserBookmark.remove({
    _id: ctx.params.bookmarkId,
    username,
  });
  ctx.status = 204;
}

export default {
    getUserProfile,
    getUsersProfiles,
    createUserProfile,
    updateUserProfile,

    getUserBookmarks,
    addUserBookmark,
    removeUserBookmark
}