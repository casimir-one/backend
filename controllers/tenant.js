import fs from 'fs';
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import deipRpc from '@deip/rpc-client';
import usersService from './../services/users';
import tenantService from './../services/tenant';
import config from './../config';
import { USER_PROFILE_STATUS } from './../constants/constants';

const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
const logoPath = (agency, ext) => `${filesStoragePath}/agencies/${agency}/logo.${ext}`;

const getTenantProfile = async (ctx) => {
  const tenantId = ctx.params.tenant;

  try {

    const tenantProfile = await tenantService.findTenantProfile(tenantId);
    if (!tenantProfile) {
      ctx.status = 404;
      ctx.body = `Tenant Profile for '${tenantId}' does not exist`
      return;
    }

    ctx.status = 200;
    ctx.body = tenantProfile;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const updateTenantProfile = async (ctx) => {
  const update = ctx.request.body;
  const jwtUsername = ctx.state.user.username;
  const tenantId = ctx.state.tenant.id;

  try {

    const tenantProfile = await tenantService.findTenantProfile(tenantId);
    if (!tenantProfile) {
      ctx.status = 404;
      ctx.body = `Tenant Profile for '${tenantId}' does not exist`
      return;
    }

    const profileData = tenantProfile.toObject();
    const updatedTenantProfile = await tenantService.updateTenantProfile(
      tenantId, 
      { ...profileData, ...update }, 
      { ...profileData.settings, ...update.settings }
    );

    ctx.status = 200;
    ctx.body = updatedTenantProfile;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}



const getTenantLogo = async (ctx) => {
  const tenant = ctx.params.tenant;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const ext = ctx.query.ext ? ctx.query.ext : 'png';

  try {

    var src = logoPath(tenant, ext);
    const stat = util.promisify(fs.stat);

    try {
      const check = await stat(src);
    } catch (err) {
      ctx.status = 404;
      return;
    }

    const resize = (w, h) => {
      return new Promise((resolve) => {
        sharp.cache(!noCache);
        sharp(src)
          .rotate()
          .resize(w, h)
          .png()
          .toBuffer()
          .then(data => {
            resolve(data)
          })
          .catch(err => {
            resolve(err)
          });
      })
    }

    const logo = await resize(width, height);
    ctx.type = 'image/jpeg';
    ctx.body = logo;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getSignUpRequests = async (ctx) => {

  try {

    const profiles = await usersService.findPendingUserProfiles();
    ctx.status = 200;
    ctx.body = profiles;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const approveSignUpRequest = async (ctx) => {
  const { username } = ctx.request.body;

  try {

    // TODO: check jwtUsername for admin

    const profile = await usersService.findUserProfileByOwner(username);
    if (!profile) {
      ctx.status = 404;
      ctx.body = `Sign up request for ${username} does not exist`;
      return;
    }

    if (profile.status != USER_PROFILE_STATUS.PENDING) {
      ctx.status = 400;
      ctx.body = `Sign up request for ${username} was already approved`;
      return;
    }

    const profileData = profile.toObject();
    await usersService.createUserAccount({ username, pubKey: profile.signUpPubKey })
    const approvedProfile = await usersService.updateUserProfile(username, { 
      ...profileData, 
      status: USER_PROFILE_STATUS.APPROVED
    });
    ctx.status = 200;
    ctx.body = { profile: approvedProfile };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const rejectSignUpRequest = async (ctx) => {
  const { username } = ctx.request.body;

  try {

    // TODO: check jwtUsername for admin
    const profile = await usersService.findUserProfileByOwner(username);
    if (!profile) {
      ctx.status = 404;
      ctx.body = `Sign up request for ${username} does not exist`;
      return;
    }

    if (profile.status != USER_PROFILE_STATUS.PENDING) {
      ctx.status = 400;
      ctx.body = `Sign up request for ${username} was already approved and can not be rejected`;
      return;
    }

    await usersService.deleteUserProfile(username);

    ctx.status = 201;
    ctx.body = "";
  }
  catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}



export default {
  getTenantProfile,
  getTenantLogo,
  getSignUpRequests,
  approveSignUpRequest,
  rejectSignUpRequest,
  updateTenantProfile
}