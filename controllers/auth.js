import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from './../config';
import deipRpc from '@deip/deip-rpc-client';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import { signOperation, sendTransaction } from './../utils/blockchain';
import UserProfile from './../schemas/user';
import { findVerificationToken, removeVerificationToken } from './../services/verificationTokens';
import { createStandardSubscription } from './../services/subscriptions';

function Encodeuint8arr(seed) {
  return new TextEncoder("utf-8").encode(seed);
}

const signIn = async function (ctx) {
  const data = ctx.request.body;
  const username = data.username;
  const secretSigHex = data.secretSigHex;
  let accounts = await deipRpc.api.getAccountsAsync([username])

  if (accounts[0]) {
    const pubWif = accounts[0].owner.key_auths[0][0]
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

const signUp = async function (ctx) {
  const data = ctx.request.body;
  const username = data.username;
  const email = data.email;
  const firstName = data.firstName;
  const lastName = data.lastName;
  const pubKey = data.pubKey;
  const token = data.token;

  if (!token || !username || !pubKey || !email || !firstName || !/^[a-z][a-z0-9\-]+[a-z0-9]$/.test(username)) {
    ctx.status = 400;
    ctx.body = `'token', 'username', 'pubKey', 'email', 'firstName' fields are required`;
    return;
  }

  try {

    let verificationToken = await findVerificationToken(token);
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
    console.log("dd");
    if (!result.isSuccess) {
      ctx.status = 500;
      ctx.body = result.result;
      return;
    }

    let profile = await UserProfile.findOne({ '_id': username });
    if (!profile) {
      const model = new UserProfile({
        _id: username,
        email: email,
        firstName: firstName,
        lastName: lastName,
        activeOrgPermlink: username
      });
      profile = await model.save();

      await removeVerificationToken(token);
    }

    await createStandardSubscription(username);

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

    let verificationToken = await findVerificationToken(token);
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
  getVerificationToken
}