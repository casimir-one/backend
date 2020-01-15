import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from './../config';
import { FREE_PRICING_PLAN_ID } from './../common/constants';
import deipRpc from '@deip/deip-rpc-client';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import { signOperation, sendTransaction } from './../utils/blockchain';
import RegistrationPromoCode from './../schemas/registrationPromoCode';
import * as vtService from './../services/verificationTokens';
import invitesService from './../services/invites'
import usersService from './../services/users';
import mailer from './../services/emails';
import pricingPlansService from './../services/pricingPlans';
import subscriptionsService from './../services/subscriptions';
import moment from 'moment';

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
      const jwtToken = jwt.sign({
        pubKey: pubWif,
        username: username,
        exp: Math.floor(Date.now() / 1000) + (1440 * 60) // 24 hours
      }, config.jwtSecret)

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
  const {
    email,
    pricingPlan,
    inviteCode,
    registrationPromoCode,
  } = ctx.request.body;

  const expires = new Date();
  expires.setDate(expires.getDate() + 1); // 1 day expiration

  try {
    const [
      existingToken,
      existingUser,
    ] = await Promise.all([
      vtService.findVerificationTokenByEmail(email),
      usersService.findUserByEmail(email),
    ]);
    const emailHasActiveToken = existingToken !== null && existingToken.expirationTime.getTime() > Date.now();
    if (emailHasActiveToken || existingUser) {
      ctx.status = 400;
      ctx.body = 'Provided email has already started or completed the registration'
      return;
    }
    const appPricingPlan = await pricingPlansService.findPricingPlan(pricingPlan || FREE_PRICING_PLAN_ID);
    if (!appPricingPlan) {
      ctx.status = 400;
      ctx.body = 'Invalid pricing plan';
      return;
    }
    if (registrationPromoCode) {
      const activeRegistrationPromoCode = await RegistrationPromoCode.findOne({
        code: registrationPromoCode,
        active: true,
        validPricingPlans: pricingPlan,
      });
      if (!activeRegistrationPromoCode) {
        ctx.status = 400;
        ctx.body = 'Promo code is invalid or already redeemed';
        return;
      }
    }

    const savedToken = await vtService.createVerificationToken('public', {
      email,
      expirationTime: expires,
      pricingPlan: appPricingPlan._id,
      inviteCode,
    });
    await mailer.sendRegistrationEmail(email, savedToken.token, registrationPromoCode);

    ctx.status = 200;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const signUp = async function (ctx) {
  const {
    username, pubKey, token,
    firstName, lastName,
    registrationPromoCode, stripeToken,
  } = ctx.request.body;
  if (!username || !pubKey || !/^[a-z][a-z0-9\-]+[a-z0-9]$/.test(username)) {
    ctx.status = 400;
    ctx.body = `'username', 'pubKey', fields are required`;
    return;
  }

  if (!token || !firstName || !lastName) {
    ctx.status = 400;
    ctx.body = `'token', 'firstName', 'lastName' fields are required`;
    return;
  }

  try {
    const verificationToken = await vtService.findVerificationToken(token);
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

    let stripeCoupon
    if (registrationPromoCode) {
      if (!stripeToken) {
        ctx.status = 400;
        ctx.body = 'Credit card is required';
        return;
      }
      if (verificationToken.pricingPlan === FREE_PRICING_PLAN_ID) {
        ctx.status = 400;
        ctx.body = 'Promo is available only for paid subscription plans';
        return;
      }
      const activeRegistrationPromoCode = await RegistrationPromoCode.findOne({
        code: registrationPromoCode,
        active: true,
        validPricingPlans: verificationToken.pricingPlan,
      });
      if (!activeRegistrationPromoCode) {
        ctx.status = 400;
        ctx.body = 'Promo code is not active';
        return;
      }
      stripeCoupon = activeRegistrationPromoCode.stripeId;
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

    await createAccountAsync(username, pubKey, owner);

    let profile = await usersService.findUserById(username);
    if (!profile) {
      profile = await usersService.createUser({
        username, firstName, lastName,
        email: verificationToken.email,
      });
      await invitesService.acceptInvite(verificationToken.inviteCode, username);
      await vtService.removeVerificationToken(token);
    }

    let subscriptionStatus = 'succeeded';
    let subscriptionClientSecret;
    const pricingPlan = await pricingPlansService.findPricingPlan(verificationToken.pricingPlan);
    if (stripeCoupon) {
      try {
        const result = await subscriptionsService.processStripeSubscription(username, {
          stripeToken,
          planId: pricingPlan.stripeId,
          coupon: stripeCoupon,
        });
        await RegistrationPromoCode.updateOne({
          code: registrationPromoCode,
        }, { $set: { active: false } });
        subscriptionStatus = result.status;
        subscriptionClientSecret = result.clientSecret;
      } catch (err) {
        subscriptionStatus = 'failed';
        console.error(err);
      }
    }
    ctx.status = 200;
    ctx.body = {
      subscriptionStatus,
      subscriptionClientSecret,
      jwtToken: jwt.sign({
        pubKey, username,
        exp: Math.floor(Date.now() / 1000) + (1440 * 60) // 24 hours
      }, config.jwtSecret)
    };
    mailer.sendNewUserRegisteredEmail({
      username, firstName, lastName,
      email: profile.email,
      pricingPlan: pricingPlan.name,
      registrationPromoCode
    });
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


async function createAccountAsync(username, pubKey, owner) {
  let accountsCreator = config.blockchain.accountsCreator;

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

  const create_subscription_op = {
    owner: username,
    agent: accountsCreator.username,
    research_group_id: undefined, // personal
    json_data: JSON.stringify({
      "external_id": "",
      "external_plan_id": "",
      "file_certificate_quota": 1, // free
      "nda_contract_quota": 1, // free
      "nda_protected_file_quota": 1, // free
      "period": 1, // month
      "billing_date": moment.utc().toDate().toISOString().split('.')[0]
    })
  };

  const operations = [
    ["account_create", account_create_op], 
    ["create_subscription", create_subscription_op]
  ];

  const signedTx = await signOperation(operations, accountsCreator.wif);
  const txInfo = await sendTransaction(signedTx);
  return txInfo;
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