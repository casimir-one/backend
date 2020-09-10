import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import deipRpc from '@deip/rpc-client';
import usersService from './../services/users';
import tenantService from './../services/tenant';
import ResearchService from './../services/research';
import * as authService from './../services/auth';
import config from './../config';
import { USER_PROFILE_STATUS } from './../constants';
import { tenantBannerForm } from './../forms/tenantForms';
import * as blockchainService from './../utils/blockchain';
import mongoose from 'mongoose';


const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
const tenantStoragePath = (tenantId) => `${filesStoragePath}/tenants/${tenantId}`;
const tenantBannerPath = (tenantId, picture) => `${tenantStoragePath(tenantId)}/${picture}`;
const tenantLogoPath = (tenantId, logo) => `${tenantStoragePath(tenantId)}/${logo}`;
const defaultTenantBannerPath = () => path.join(__dirname, `./../default/default-tenant-banner.png`);
const defaultTenantLogoPath = () => path.join(__dirname, `./../default/default-tenant-logo.png`);


const uploadTenantBanner = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenantId = ctx.request.headers['tenant-id'];

  try {

    const authorizedGroup = await authService.authorizeResearchGroupAccount(tenantId, jwtUsername);
    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to edit "${tenantId}" research`;
      return;
    }

    const tenantProfile = await tenantService.findTenantProfile(tenantId);
    if (!tenantProfile) {
      ctx.status = 404;
      ctx.body = `Tenant Profile for "${tenantId}" does not exist!`;
      return;
    }

    const stat = util.promisify(fs.stat);
    const unlink = util.promisify(fs.unlink);
    const ensureDir = util.promisify(fsExtra.ensureDir);

    try {
      const filepath = tenantStoragePath(tenantId);
      await stat(filepath);
      // await unlink(filepath);
    } catch (err) {
      await ensureDir(tenantStoragePath(tenantId))
    }

    const oldFilename = tenantProfile.banner;
    const tenantBanner = tenantBannerForm.single('tenant-banner');
    const { filename } = await tenantBanner(ctx, () => new Promise((resolve, reject) => {
      resolve({ 'filename': ctx.req.file.filename });
    }));

    tenantProfile.banner = filename;
    const updatedTenantProfile = await tenantProfile.save();

    if (oldFilename != filename) {
      try {
        await unlink(tenantBannerPath(tenantId, oldFilename));
      } catch (err) { }
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
  const tenantId = ctx.params.tenant;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

  try {

    let tenantProfile = await tenantService.findTenantProfile(tenantId);
    let src = tenantBannerPath(tenantId, tenantProfile.banner);

    try {

      const stat = util.promisify(fs.stat);
      const check = await stat(src);
    } catch (err) {
      src = defaultTenantBannerPath();
    }

    let resize = (w, h) => {
      return new Promise((resolve, reject) => {
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
  const tenantId = ctx.params.tenant;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

  try {

    let tenantProfile = await tenantService.findTenantProfile(tenantId);
    let src = tenantLogoPath(tenantId, tenantProfile.logo);

    try {

      const stat = util.promisify(fs.stat);
      const check = await stat(src);
    } catch (err) {
      src = defaultTenantLogoPath();
    }

    let resize = (w, h) => {
      return new Promise((resolve, reject) => {
        sharp.cache(!noCache);
        sharp(src)
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
  const tenantId = ctx.params.tenant;

  try {

    const tenantProfile = await tenantService.findTenantProfile(tenantId);
    if (!tenantProfile) {
      ctx.status = 404;
      ctx.body = `Tenant Profile for '${tenantId}' does not exist`
      return;
    }

    const tenant = tenantProfile.toObject();

    // const researchService = new ResearchService(tenant);
    // const categoryStatsPromises = [];

    // for (let i = 0; i < tenant.settings.researchCategories.length; i++) {
    //   let category = tenant.settings.researchCategories[i];
    //   let promise = researchService.findResearchesByCategory(category);
    //   categoryStatsPromises.push(promise);
    // }

    // const researchesByCategories = await Promise.all(categoryStatsPromises);

    // for (let i = 0; i < tenant.settings.researchCategories.length; i++) {
    //   let category = tenant.settings.researchCategories[i];
    //   category.researchCount = researchesByCategories[i].length;
    // }

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
  const researchService = new ResearchService(tenant);
  const update = ctx.request.body;

  try {

    const tenantId = tenant.id;
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


const createTenantResearchAttribute = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchAttribute = ctx.request.body;

  try {
    const researchService = new ResearchService(tenant);

    const researchAttributeId = mongoose.Types.ObjectId();
    const updatedTenantProfile = await tenantService.addTenantResearchAttribute(tenant.id, { ...researchAttribute, _id: researchAttributeId.toString() });
    const newResearchAttribute = updatedTenantProfile.settings.researchAttributes.find(a => a._id.toString() === researchAttributeId.toString());

    await researchService.addAttributeToResearches({ 
      researchAttributeId: newResearchAttribute._id.toString(), 
      type: researchAttribute.type,
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


const deleteTenantResearchAttribute = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchAttributeId = ctx.params.id;

  try {
    const researchService = new ResearchService(tenant);

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
    const researchService = new ResearchService(tenant);

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