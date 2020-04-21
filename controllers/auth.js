import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from './../config';
import deipRpc from '@deip/rpc-client';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import usersService from './../services/users';

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
  const data = ctx.request.body;
  const username = data.username;
  const email = data.email;
  const firstName = data.firstName;
  const lastName = data.lastName;
  const pubKey = data.pubKey;

  if (!username || !pubKey || !email || !firstName || !/^[a-z][a-z0-9\-]+[a-z0-9]$/.test(username)) {
    ctx.status = 400;
    ctx.body = `'username', 'pubKey', 'email', 'firstName' fields are required`;
    return;
  }

  try {

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

    const txResult = await createAccountAsync(username, pubKey, owner);
    let profile = await usersService.findUserProfileByOwner(username);
    if (!profile) {
      profile = await usersService.createUserProfile({ username, email, firstName, lastName });
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
  const accountsCreator = config.blockchain.accountsCreator;
  const chainConfig = await deipRpc.api.getConfigAsync();
  const chainProps = await deipRpc.api.getChainPropertiesAsync();
  // const ratio = chainConfig['DEIP_CREATE_ACCOUNT_DELEGATION_RATIO'];
  // var fee = Asset.from(chainProps.account_creation_fee).multiply(ratio);
  const jsonMetadata = '';
  const traits = [];
  const extensions = [];

  let txResult = await deipRpc.broadcast.createAccountAsync(
    accountsCreator.wif,
    accountsCreator.fee,
    accountsCreator.username,
    username,
    owner,
    owner,
    owner,
    pubKey,
    jsonMetadata,
    traits,
    extensions);

  return txResult
}


export default {
  signIn,
  signUp
}