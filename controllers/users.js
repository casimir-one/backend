import UserProfile from './../schemas/user'

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

export default {
    getUserProfile,
    createUserProfile,
    updateUserProfile
}