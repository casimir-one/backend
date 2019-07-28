import Subscription from './../schemas/subscription';
import moment from 'moment';

async function findSubscriptionByOwner(owner) {
  const subscription = await Subscription.findOne({ owner });
  return subscription;
}

async function createStandardSubscription(owner) {
  const subscription = new Subscription({
    owner: owner,
    pricingPlan: "standard",
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

async function createWhiteLabelSubscription(owner) {
  const subscription = new Subscription({
    owner: owner,
    pricingPlan: "white-label",
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

export {
  findSubscriptionByOwner,
  createStandardSubscription,
  createWhiteLabelSubscription,
  createUnlimitedSubscription,
  resetCertificateLimits,
  increaseCertificateLimitCounter
}