import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import UserService from './../services/users';
import TenantService from './../services/tenant';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import FileStorage from './../storage';
import config from './../config';
import { USER_PROFILE_STATUS } from './../constants';
import TenantSettingsForm from './../forms/tenantSettings';
import * as blockchainService from './../utils/blockchain';
import mongoose from 'mongoose';


const updateTenantSettings = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenantExternalId = ctx.state.tenant.id;

  try {

    const tenantService = new TenantService();
    const tenant = await tenantService.getTenant(tenantExternalId);
    const oldBanner = tenant.profile.banner;
    const oldLogo = tenant.profile.logo;
    const { banner, logo, title } = await TenantSettingsForm(ctx);

    const update = {
      banner: banner ? banner : tenant.profile.banner,
      logo: logo ? logo : tenant.profile.logo,
      name: title ? title : tenant.profile.name
    }

    const updatedTenantProfile = await tenantService.updateTenantProfile(tenantExternalId, update, {});

    if (banner && oldBanner != banner) {
      const oldFilepath = FileStorage.getTenantBannerFilePath(tenantExternalId, oldBanner);
      const exists = await FileStorage.exists(oldFilepath);
      if (exists) {
        await FileStorage.delete(oldFilepath);
      }
    }

    if (logo && oldLogo != logo) {
      const oldFilepath = FileStorage.getTenantLogoFilePath(tenantExternalId, oldLogo);
      const exists = await FileStorage.exists(oldFilepath);
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

    const tenantService = new TenantService();
    const tenant = await tenantService.getTenant(tenantExternalId);
    const defaultBanner = FileStorage.getTenantDefaultBannerFilePath();

    let src;
    let buff;

    if (tenant.profile.banner) {
      const filepath = FileStorage.getTenantBannerFilePath(tenantExternalId, tenant.profile.banner);
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

    const tenantService = new TenantService();
    const tenant = await tenantService.getTenant(tenantExternalId);
    const defaultLogo = FileStorage.getTenantDefaultLogoFilePath();

    let src;
    let buff;

    if (tenant.profile.logo) {
      const filepath = FileStorage.getTenantLogoFilePath(tenantExternalId, tenant.profile.logo);
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


const getTenant = async (ctx) => {
  const tenantExternalId = ctx.params.tenant;
  try {
    const tenantService = new TenantService();
    const tenant = await tenantService.getTenant(tenantExternalId);
    if (!tenant) {
      ctx.status = 404;
      ctx.body = `Tenant '${tenantExternalId}' does not exist`
      return;
    }
    ctx.status = 200;
    ctx.body = tenant;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getNetworkInfo = async (ctx) => {
  try {
    const tenantService = new TenantService();
    const map = await tenantService.getNetworkInfo();
    ctx.status = 200;
    ctx.body = map;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const updateTenantProfile = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const update = ctx.request.body;
  const tenantExternalId = ctx.state.tenant.id;

  try {

    const tenantService = new TenantService();
    const tenant = await tenantService.getTenant(tenantExternalId);
    const updatedTenantProfile = await tenantService.updateTenantProfile(
      tenantExternalId, 
      { ...tenant.profile, ...update }, 
      { ...tenant.profile.settings, ...update.settings }
    );

    ctx.status = 200;
    ctx.body = updatedTenantProfile;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const updateTenantNetworkSettings = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const update = ctx.request.body;
  const tenantExternalId = ctx.state.tenant.id;

  try {

    const tenantService = new TenantService();
    const updatedTenantProfile = await tenantService.updateTenantNetworkSettings(
      tenantExternalId,
      update
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
    const tenantService = new TenantService();

    const researchAttributeId = mongoose.Types.ObjectId();
    const updatedTenantProfile = await tenantService.addTenantResearchAttribute(tenant.id, { ...researchAttribute, _id: researchAttributeId.toString() });
    const newResearchAttribute = updatedTenantProfile.settings.researchAttributes.find(a => a._id.toString() === researchAttributeId.toString());

    ctx.status = 200;
    ctx.body = updatedTenantProfile;

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
    const tenantService = new TenantService();

    const updatedTenantProfile = await tenantService.removeTenantResearchAttribute(tenant.id, { _id: researchAttributeId });

    await researchService.removeAttributeFromResearches({
      researchAttributeId: researchAttributeId
    });

    ctx.status = 200;
    ctx.body = updatedTenantProfile;

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
    const tenantService = new TenantService();

    const updatedTenantProfile = await tenantService.updateTenantResearchAttribute(tenant.id, { ...researchAttribute });
    
    await researchService.updateAttributeInResearches({
      researchAttributeId: researchAttribute._id,
      type: researchAttribute.type,
      valueOptions: researchAttribute.valueOptions,
      defaultValue: researchAttribute.defaultValue || null
    });

    ctx.status = 200;
    ctx.body = updatedTenantProfile;

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

  getNetworkInfo,

  getTenant,
  getTenantBanner,
  getTenantLogo,
  getSignUpRequests,
  approveSignUpRequest,
  rejectSignUpRequest,
  updateTenantProfile,
  updateTenantNetworkSettings,
  updateTenantSettings,
  addTenantAdmin,
  removeTenantAdmin
}