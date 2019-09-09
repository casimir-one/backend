import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from './../config';
import { FREE_PRICING_PLAN_ID } from './../common/constants';
import deipRpc from '@deip/deip-rpc-client';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import { signOperation, sendTransaction } from './../utils/blockchain';
import UserProfile from './../schemas/user';
import * as vtService from './../services/verificationTokens';
import usersService from './../services/users';
import mailer from './../services/emails';

function Encodeuint8arr(seed) {
  return new TextEncoder("utf-8").encode(seed);
}

const signIn = async function (ctx) {
  const data = ctx.request.body;
  const username = data.username;
  const secretSigHex = data.secretSigHex;
  let accounts = await deipRpc.api.getAccountsAsync([username])

  if (accounts[0]) {
    const pubWif = accounts[0].owner.key_auths[0][0];
    const publicKey = crypto.PublicKey.from(pubWif);

    var isValid;
    try {
      // sigSeed should be uint8 array with length = 32
      isValid = publicKey.verify(
        Encodeuint8arr(config.sigSeed).buffer,
        crypto.unhexify(secretSigHex).buffer);
    } catch (err) {
      isValid = false;
    }

    if (isValid) {
      const jwtSecret = config.jwtSecret;
      const jwtToken = jwt.sign({
        pubKey: pubWif,
        username: username,
        exp: Math.floor(Date.now() / 1000) + (1440 * 60) // 24 hours
      }, jwtSecret)

      ctx.body = {
        success: true,
        jwtToken: jwtToken
      }

    } else {

      ctx.body = {
        success: false,
        error: `Signature is invalid for ${username}, make sure you specify correct private key`
      }
    }

  } else {
    ctx.body = {
      success: false,
      error: `User "${username}" does not exist!`
    }
  }
}

const createVerificationToken = async function (ctx) {
  const { email, pricingPlan } = ctx.request.body;

  const expires = new Date();
  expires.setDate(expires.getDate() + 1); // 1 day expiration

  try {
    const [existingToken, existingUser] = await Promise.all([
      vtService.findVerificationTokenByEmail(email),
      usersService.findUserByEmail(email)
    ]);
    if (existingToken || existingUser) {
      ctx.status = 400;
      ctx.body = 'Provided email has already started or completed the registration'
      return;
    }

    const savedToken = await vtService.createVerificationToken('public', {
      email,
      expirationTime: expires,
      pricingPlan: FREE_PRICING_PLAN_ID
    });
    await mailer.sendRegistrationUrl(email, savedToken.token);

    ctx.status = 200;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const signUp = async function (ctx) {
  const data = ctx.request.body;
  const username = data.username;
  const pubKey = data.pubKey;
  const token = data.token;

  let email = data.email;
  let firstName = data.firstName;
  let lastName = data.lastName;

  if (!username || !pubKey || !/^[a-z][a-z0-9\-]+[a-z0-9]$/.test(username)) {
    ctx.status = 400;
    ctx.body = `'username', 'pubKey', fields are required`;
    return;
  }

  if (!token && (!email || !firstName || !lastName)) {
    ctx.status = 400;
    ctx.body = `'email', 'firstName', 'lastName' fields are required`;
    return;
  }

  try {
    
    var verificationToken;
    if (token) {
      verificationToken = await vtService.findVerificationToken(token);
      if (!verificationToken) {
        ctx.status = 404;
        ctx.body = `Verification token ${token} is not found`;
        return;
      }

      let isExpired = verificationToken.expirationTime.getTime() <= Date.now();
      if (isExpired) {
        ctx.status = 400;
        ctx.body = `Verification token ${token} is expired`;
        return;
      }

      email = verificationToken.email;
    }

    const accounts = await deipRpc.api.getAccountsAsync([username])
    if (accounts[0]) {
      ctx.status = 409;
      ctx.body = `Account '${username}' already exists`;
      return;
    }

    const owner = {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [[pubKey, 1]]
    };

    const result = await createAccountAsync(username, pubKey, owner);
    if (!result.isSuccess) {
      ctx.status = 500;
      ctx.body = result.result;
      return;
    }

    let profile = await usersService.findUserById(username);
    if (!profile) {
      profile = await usersService.createUser({ username, email, firstName, lastName });
      await vtService.removeVerificationToken(token);
    }

    ctx.status = 200;
    ctx.body = profile;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


async function createAccountAsync(username, pubKey, owner) {
  try {
    let accountsCreator = config.blockchain.accountsCreator;
    let cfg = await deipRpc.api.getConfigAsync();
    let chainProps = await deipRpc.api.getChainPropertiesAsync();

    const account_create_op = {
      fee: accountsCreator.fee,
      creator: accountsCreator.username,
      new_account_name: username,
      owner: owner,
      active: owner,
      posting: owner,
      memo_key: pubKey,
      json_metadata: ""
    };

    const operation = ["account_create", account_create_op];
    const signedTx = await signOperation(operation, accountsCreator.wif);
    const result = await sendTransaction(signedTx);

    return { isSuccess: true, result: result };
  } catch (err) {
    console.log(err);
    return { isSuccess: false, result: err }
  }
  
}


const getVerificationToken = async function(ctx) {
  const token = ctx.query.token;

  try {

    if (!token) {
      ctx.status = 400;
      ctx.body = `Verification token is not provided`;
      return;
    }

    let verificationToken = await vtService.findVerificationToken(token);
    if (!verificationToken) {
      ctx.status = 404;
      ctx.body = `Verification token ${token} is not found`;
      return;
    }

    let isExpired = verificationToken.expirationTime.getTime() <= Date.now();

    ctx.status = 200;
    ctx.body = { isExpired, data: verificationToken };

  } catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
  signIn,
  signUp,
  getVerificationToken,
  createVerificationToken
}