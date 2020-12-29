import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from './../config';
import deipRpc from '@deip/rpc-client';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import usersService from './../services/users';
import ResearchGroupService from './../services/researchGroup';
import tenantsService from './../services/tenant';

import { USER_PROFILE_STATUS, SIGN_UP_POLICY} from './../constants';

function Encodeuint8arr(seed) {
  return new TextEncoder("utf-8").encode(seed);
}

const signIn = async function (ctx) {
  const { username, secretSigHex } = ctx.request.body;
  const tenant = ctx.state.tenant;

  try {

    const [account] = await deipRpc.api.getAccountsAsync([username])
    if (!account) {
      ctx.body = {
        success: false,
        error: `User "${username}" does not exist!`
      };
      return;
    }

    if (ctx.state.isTenantRoute && !tenant.admins.some(name => name == username)) {
      ctx.body = {
        success: false,
        error: `User "${username}" does not have admin rights`
      };
      return;
    }

    const pubWif = account.owner.key_auths[0][0]
    const publicKey = crypto.PublicKey.from(pubWif);

    let isValidSig;
    try {
      // SIG_SEED should be uint8 array with length = 32
      isValidSig = publicKey.verify(Encodeuint8arr(config.SIG_SEED).buffer, crypto.unhexify(secretSigHex).buffer);
    } catch (err) {
      isValidSig = false;
    }

    if (!isValidSig) {
      ctx.body = {
        success: false,
        error: `Signature is invalid for ${username}, make sure you specify correct private key`
      };
      return;
    }

    const jwtToken = jwt.sign({
      username,
      tenant: tenant.id,
      isTenantAdmin: tenant.admins.some(name => name == username),
      exp: Math.floor(Date.now() / 1000) + (60 * 24 * 60),
    }, config.JWT_SECRET);

    ctx.status = 200;
    ctx.body = {
      success: true,
      jwtToken
    };

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const signUp = async function (ctx) {
  const { 
    username, 
    email, 
    firstName, 
    lastName, 
    pubKey,
    phoneNumbers,
    webPages,
    location,
    category,
    occupation,
    birthdate,
    bio,
    foreignIds
  } = ctx.request.body;

  try {

    const researchGroupService = new ResearchGroupService();

    const tenant = ctx.state.tenant;
    const status = tenant.settings.signUpPolicy == SIGN_UP_POLICY.FREE || ctx.state.isTenantAdmin
      ? USER_PROFILE_STATUS.APPROVED
      : USER_PROFILE_STATUS.PENDING;


    if (!username || !pubKey || !email || !/^[a-z][a-z0-9\-]+[a-z0-9]$/.test(username)) {
      ctx.status = 400;
      ctx.body = `'username', 'pubKey', 'email', fields are required. Username allowable symbols are: [a-z0-9] `;
      return;
    }

    const [existingAccount] = await deipRpc.api.getAccountsAsync([username])
    if (existingAccount) {
      ctx.status = 409;
      ctx.body = `Account '${username}' already exists`;
      return;
    }

    const existingProfile = await usersService.findUserProfileByOwner(username);
    if (existingProfile) {
      ctx.status = 409;
      ctx.body = `Profile for '${username}' is under consideration or has been approved already`;
      return;
    }

    const userProfile = await usersService.createUserProfile({
      username,
      status,
      signUpPubKey: pubKey,
      tenant: tenant.id,
      email,
      firstName,
      lastName,
      phoneNumbers,
      webPages,
      location,
      category,
      occupation,
      foreignIds,
      birthdate,
      bio
    });

    let account = null;
    if (status == USER_PROFILE_STATUS.APPROVED) {
      account = await usersService.createUserAccount({ username, pubKey });

      const researchGroup = await deipRpc.api.getResearchGroupByPermlinkAsync(username);
      await researchGroupService.createResearchGroupRef({
        externalId: researchGroup.external_id,
        creator: researchGroup.creator,
        name: username,
        description: username
      });
    }

    ctx.status = 200;
    ctx.body = { profile: userProfile, account };

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
  signIn,
  signUp
}