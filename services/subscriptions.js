import Subscription from './../schemas/subscription';
import stripeService from './../services/stripe';
import usersService from './../services/users';
import moment from 'moment';

async function findSubscriptionByOwner(owner) {
  const subscription = await Subscription.findOne({ owner });
  return subscription;
}

async function processStripeSubscription(owner, { stripeToken, customerEmail, planId, planName }) {
  let { customer, subscription } = await stripeService.createCustomerAndSubscription({ stripeToken, customerEmail, planId });
  let appSubsription = await createSubscription(planName, owner, subscription.id);
  let appCustomer = await usersService.updateStripeCustomerId(owner, customer.id);
  return { appSubsription, appCustomer };
}

async function createFreeSubscription(owner) {
  const subscription = new Subscription({
    owner: owner,
    stripeId: null,
    pricingPlan: "free",
    limits: {
      certificateLimit: {
        counter: 0,
        resetTime: moment().add(1, 'M').toDate()
      }
    },
    expirationTime: moment().add(100, 'Y').toDate()
  });
  const savedSubscription = await subscription.save();
  return savedSubscription;
}

async function createStandardSubscription(owner, stripeId) {
  if (!stripeId) throw Error("Stripe subscription id must be provided");
  const subscription = new Subscription({
    owner: owner,
    stripeId: stripeId,
    pricingPlan: "standard-monthly",
    limits: {
      certificateLimit: {
        counter: 0,
        resetTime: moment().add(1, 'M').toDate()
      }
    },
    expirationTime: moment().add(100, 'Y').toDate()
  });
  const savedSubscription = await subscription.save();
  return savedSubscription;
}

async function createPremiumSubscription(owner, stripeId) {
  if (!stripeId) throw Error("Stripe subscription id must be provided");

  const subscription = new Subscription({
    owner: owner,
    stripeId: stripeId,
    pricingPlan: "premium-monthly",
    limits: {
      certificateLimit: {
        counter: 0,
        resetTime: moment().add(1, 'M').toDate()
      }
    },
    expirationTime: moment().add(100, 'Y').toDate()
  });
  const savedSubscription = await subscription.save();
  return savedSubscription;
}

async function createUnlimitedSubscription(owner) {
  const subscription = new Subscription({
    owner: owner,
    stripeId: null,
    pricingPlan: "unlimited",
    expirationTime: moment().add(100, 'Y').toDate()
  });
  const savedSubscription = await subscription.save();
  return savedSubscription;
}

async function increaseCertificateLimitCounter(_id, inc) {
  const updatedSubscription = await Subscription.findOneAndUpdate({ _id }, { $inc: { "limits.certificateLimit.counter": inc } });
  return updatedSubscription;
}

async function resetCertificateLimits() {
  const result = await Subscription.update(
    {
      $and: [
        { "limits.certificateLimit": { $exists: true } },
        { "limits.certificateLimit.resetTime": { $lt: moment().endOf('day').toDate() } }
      ]
    },
    {
      "limits.certificateLimit.counter": 0,
      "limits.certificateLimit.resetTime": moment().add(1, 'M').toDate()
    },
    { multi: true });
  return result;
}


async function createSubscription(pricingPlan, username, stripeId = null) {
  let subscription;
  switch (pricingPlan) {
    case "free":
      subscription = await createFreeSubscription(username);
      return subscription;
    case "standard-monthly":
      subscription = await createStandardSubscription(username, stripeId);
      return subscription;
    case "premium-monthly":
      subscription = await createPremiumSubscription(username, stripeId);
      return subscription;
    case "unlimited":
      subscription = await createUnlimitedSubscription(username);
      return subscription;
    default:
      return;
  }
}

export default {
  findSubscriptionByOwner,
  createSubscription,
  processStripeSubscription,
  resetCertificateLimits,
  increaseCertificateLimitCounter,
}