import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from './../config';
import deipRpc from '@deip/rpc-client';
import crypto from '@deip/lib-crypto';

import { TextEncoder } from 'util';
import usersService from './../services/users';
import { USER_PROFILE_STATUS, SIGN_UP_POLICY} from './../constants/constants';

function Encodeuint8arr(seed) {
  return new TextEncoder("utf-8").encode(seed);
}

const signIn = async function (ctx) {
  const {
    username,
    secretSigHex
  } = ctx.request.body;

  const [account] = await deipRpc.api.getAccountsAsync([username])
  if (!account) {
    ctx.body = {
      success: false,
      error: `User "${username}" does not exist!`
    };
    return;
  }

  const pubWif = account.owner.key_auths[0][0]
  const publicKey = crypto.PublicKey.from(pubWif);
  let isValidSig;
  try {
    // sigSeed should be uint8 array with length = 32
    isValidSig = publicKey.verify(
      Encodeuint8arr(config.sigSeed).buffer,
      crypto.unhexify(secretSigHex).buffer
    );
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
    exp: Math.floor(Date.now() / 1000) + (60 * 24 * 60), // 3 hours
  }, config.jwtSecret)

  ctx.body = {
    success: true,
    jwtToken
  };
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

    let isAdmin = ctx.path.indexOf("tenant") != -1; // todo move to middleware

    let status = ctx.tenantSettings.signUpPolicy == SIGN_UP_POLICY.FREE || isAdmin
      ? USER_PROFILE_STATUS.APPROVED
      : USER_PROFILE_STATUS.PENDING;


    if (!username || !pubKey || !email || !firstName || !/^[a-z][a-z0-9\-]+[a-z0-9]$/.test(username)) {
      ctx.status = 400;
      ctx.body = `'username', 'pubKey', 'email', 'firstName' fields are required`;
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

    const profile = await usersService.createUserProfile({
      username,
      status,
      signUpPubKey: pubKey,
      tenant: config.TENANT,
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
    }

    ctx.status = 200;
    ctx.body = { profile, account };

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