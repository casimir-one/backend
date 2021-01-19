import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import deipRpc from '@deip/rpc-client';
import UserService from './../services/users';
import tenantService from './../services/tenant';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import FileStorage from './../storage';
import config from './../config';
import { USER_PROFILE_STATUS } from './../constants';
import TeantBannerForm from './../forms/tenantBanner';
import * as blockchainService from './../utils/blockchain';
import mongoose from 'mongoose';


const uploadTenantBanner = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenantExternalId = ctx.request.headers['tenant-id'];

  try {

    const researchGroupService = new ResearchGroupService();
    const authorizedGroup = await researchGroupService.authorizeResearchGroupAccount(tenantExternalId, jwtUsername);
    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to edit "${tenantExternalId}" research`;
      return;
    }

    const tenantProfile = await tenantService.findTenantProfile(tenantExternalId);
    if (!tenantProfile) {
      ctx.status = 404;
      ctx.body = `Tenant Profile for "${tenantExternalId}" does not exist!`;
      return;
    }

    const oldFilename = tenantProfile.banner;
    const { filename } = await TeantBannerForm(ctx);
    tenantProfile.banner = filename;

    const updatedTenantProfile = await tenantProfile.save();

    if (oldFilename != filename) {
      const oldFilepath = FileStorage.getTenantBannerFilePath(tenantExternalId, oldFilename);
      const exists = await FileStorage.get(oldFilepath);
      if (exists) {
        await FileStorage.delete(oldFilepath);
      }
    }

    ctx.status = 200;
    ctx.body = updatedTenantProfile;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getTenantBanner = async (ctx) => {
  const tenantExternalId = ctx.params.tenant;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

  try {

    const tenantProfile = await tenantService.findTenantProfile(tenantExternalId);
    const defaultBanner = FileStorage.getTenantDefaultBannerFilePath();

    let src;
    let buff;

    if (tenantProfile.banner) {
      const filepath = FileStorage.getTenantBannerFilePath(tenantExternalId, tenantProfile.banner);
      const exists = await FileStorage.exists(filepath);
      if (exists) {
        buff = await FileStorage.get(filepath);
      } else {
        src = defaultBanner;
      }
    } else {
      src = defaultBanner;
    }

    let resize = (w, h) => {
      return new Promise((resolve, reject) => {
        sharp.cache(!noCache);
        sharp(buff || src)
          .rotate()
          .resize(w, h)
          .png()
          .toBuffer()
          .then(data => {
            resolve(data)
          })
          .catch(err => {
            reject(err)
          });
      })
    }

    let banner = await resize(width, height);

    if (isRound) {
      let round = (w) => {
        let r = w / 2;
        let circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
        return new Promise((resolve, reject) => {
          banner = sharp(banner)
            .overlayWith(circleShape, { cutout: true })
            .png()
            .toBuffer()
            .then(data => {
              resolve(data)
            })
            .catch(err => {
              reject(err)
            });
        });
      }

      banner = await round(width);
    }

    ctx.type = 'image/png';
    ctx.body = banner;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getTenantLogo = async (ctx) => {
  const tenantExternalId = ctx.params.tenant;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

  try {

    const tenantProfile = await tenantService.findTenantProfile(tenantExternalId);
    const defaultLogo = FileStorage.getTenantDefaultLogoFilePath();

    let src;
    let buff;

    if (tenantProfile.banner) {
      const filepath = FileStorage.getTenantLogoFilePath(tenantExternalId, tenantProfile.logo);
      const exists = await FileStorage.exists(filepath);
      if (exists) {
        buff = await FileStorage.get(filepath);
      } else {
        src = defaultLogo;
      }
    } else {
      src = defaultLogo;
    }

    let resize = (w, h) => {
      return new Promise((resolve, reject) => {
        sharp.cache(!noCache);
        sharp(buff || src)
          .rotate()
          // .resize(w, h)
          .png()
          .toBuffer()
          .then(data => {
            resolve(data)
          })
          .catch(err => {
            reject(err)
          });
      })
    }

    let logo = await resize(width, height);

    if (isRound) {
      let round = (w) => {
        let r = w / 2;
        let circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
        return new Promise((resolve, reject) => {
          logo = sharp(logo)
            .overlayWith(circleShape, { cutout: true })
            .png()
            .toBuffer()
            .then(data => {
              resolve(data)
            })
            .catch(err => {
              reject(err)
            });
        });
      }

      logo = await round(width);
    }

    ctx.type = 'image/png';
    ctx.body = logo;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getTenantProfile = async (ctx) => {
  const tenantExternalId = ctx.params.tenant;

  try {

    const tenantProfile = await tenantService.findTenantProfile(tenantExternalId);
    if (!tenantProfile) {
      ctx.status = 404;
      ctx.body = `Tenant Profile for '${tenantExternalId}' does not exist`
      return;
    }

    const tenant = tenantProfile.toObject();

    ctx.status = 200;
    ctx.body = tenant;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const updateTenantProfile = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchService = new ResearchService();
  const update = ctx.request.body;

  try {

    const tenantExternalId = tenant.id;
    const tenantProfile = await tenantService.findTenantProfile(tenantExternalId);
    if (!tenantProfile) {
      ctx.status = 404;
      ctx.body = `Tenant Profile for '${tenantExternalId}' does not exist`
      return;
    }

    const profileData = tenantProfile.toObject();
    const updatedTenantProfile = await tenantService.updateTenantProfile(
      tenantExternalId, 
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


const createTenantResearchAttribute = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchAttribute = ctx.request.body;

  try {
    const researchService = new ResearchService();

    const researchAttributeId = mongoose.Types.ObjectId();
    const updatedTenantProfile = await tenantService.addTenantResearchAttribute(tenant.id, { ...researchAttribute, _id: researchAttributeId.toString() });
    const newResearchAttribute = updatedTenantProfile.settings.researchAttributes.find(a => a._id.toString() === researchAttributeId.toString());

    ctx.status = 200;
    ctx.body = updatedTenantProfile.toObject();

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const deleteTenantResearchAttribute = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchAttributeId = ctx.params.id;

  try {
    const researchService = new ResearchService();

    const updatedTenantProfile = await tenantService.removeTenantResearchAttribute(tenant.id, { _id: researchAttributeId });

    await researchService.removeAttributeFromResearches({
      researchAttributeId: researchAttributeId
    });

    ctx.status = 200;
    ctx.body = updatedTenantProfile.toObject();

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const updateTenantResearchAttribute = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchAttribute = ctx.request.body;

  try {
    const researchService = new ResearchService();

    const updatedTenantProfile = await tenantService.updateTenantResearchAttribute(tenant.id, { ...researchAttribute });
    
    await researchService.updateAttributeInResearches({
      researchAttributeId: researchAttribute._id,
      type: researchAttribute.type,
      valueOptions: researchAttribute.valueOptions,
      defaultValue: researchAttribute.defaultValue || null
    });

    ctx.status = 200;
    ctx.body = updatedTenantProfile.toObject();

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getSignUpRequests = async (ctx) => {
  try {
    const usersService = new UserService();
    const pendingUsersProfiles = await usersService.findUserProfilesByStatus(USER_PROFILE_STATUS.PENDING);
    ctx.status = 200;
    ctx.body = pendingUsersProfiles;
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
    const usersService = new UserService();
    const researchGroupService = new ResearchGroupService();

    const userProfile = await usersService.findUserProfileByOwner(username);
    if (!userProfile) {
      ctx.status = 404;
      ctx.body = `Sign up request for ${username} does not exist`;
      return;
    }

    if (userProfile.status != USER_PROFILE_STATUS.PENDING) {
      ctx.status = 400;
      ctx.body = `Sign up request for ${username} was already approved`;
      return;
    }

    await usersService.createUserAccount({ username, pubKey: userProfile.signUpPubKey });
    await researchGroupService.createResearchGroupRef({
      externalId: username,
      creator: username,
      name: username,
      description: username
    });

    const approvedProfile = await usersService.updateUserProfile(username, { status: USER_PROFILE_STATUS.APPROVED });

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
    const usersService = new UserService();
    const userProfile = await usersService.findUserProfileByOwner(username);
    if (!userProfile) {
      ctx.status = 404;
      ctx.body = `Sign up request for ${username} does not exist`;
      return;
    }

    if (userProfile.status != USER_PROFILE_STATUS.PENDING) {
      ctx.status = 400;
      ctx.body = `Sign up request for ${username} was already approved and can not be rejected`;
      return;
    }

    await usersService.deleteUserProfile(username);

    ctx.status = 201;
    ctx.body = "";

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const addTenantAdmin = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const operation = tx['operations'][0];
    const payload = operation[1];
    const txResult = await blockchainService.sendTransactionAsync(tx);

    ctx.status = 200;
    ctx.body = { tx, txResult };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const removeTenantAdmin = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const operation = tx['operations'][0];
    const payload = operation[1];
    const txResult = await blockchainService.sendTransactionAsync(tx);

    ctx.status = 200;
    ctx.body = { tx, txResult };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


export default {

  createTenantResearchAttribute,
  updateTenantResearchAttribute,
  deleteTenantResearchAttribute,

  getTenantProfile,
  getTenantBanner,
  getTenantLogo,
  getSignUpRequests,
  approveSignUpRequest,
  rejectSignUpRequest,
  updateTenantProfile,
  uploadTenantBanner,
  addTenantAdmin,
  removeTenantAdmin
}