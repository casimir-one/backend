import pricingPlansService from './../services/pricingPlans';
import stripeService from './../services/stripe';
import usersService from './../services/users';
import moment from 'moment';

async function findSubscriptionByOwner(owner) {
  let user = await usersService.findUserById(owner);
  if (!user.stripeSubscriptionId) {
    return null;
  }

  let subscription = await stripeService.findSubscription(user.stripeSubscriptionId);
  return subscription;
}

async function processStripeSubscription(owner, { stripeToken, customerEmail, planId, planName }) {
  let pricingPlan = await pricingPlansService.findPricingPlan(planName);
  let metadata = {
    certificateLimitCounter: 0
  }

  let { customer, subscription } = await stripeService.createCustomerAndSubscription({ stripeToken, customerEmail, planId, metadata });
  let { stripePlan: plan } = pricingPlan;
  let user = await usersService.updateStripeInfo(owner, customer.id, subscription.id, plan.id);
  let result = { user, customer, plan, subscription };
  return result;
}

async function setCertificateLimitCounter(id, incremented) {
  let updatedSubscription = await stripeService.updateSubscription(id, { metadata: { certificateLimitCounter: incremented } });
  return updatedSubscription;
}

async function resetCertificatesLimitCounter() {
  let subscriptions = await stripeService.getSubscriptions();
  // TODO: Move this to stripe Webhook asap
  const promises = [];
  let endOfDay = moment().utc().endOf('day').toDate().toString();

  for (let i = 0; i < subscriptions.length; i++) {
    let subscription = subscriptions[i];
    let end = moment(subscription.current_period_end * 1000).utc().endOf('day').toDate().toString()
    if (endOfDay == end) {
      promises.push(stripeService.updateSubscription(subscription.id, { metadata: { certificateLimitCounter: 0 } }));
    }
  }

  await Promise.all(promises);
  return promises.length;
}

async function cancelSubscription(owner) {
  let user = await usersService.findUserById(owner);
  let updatedSubscription = await stripeService.cancelSubscriptionAtEndOfCurrentBillingPeriod(user.stripeSubscriptionId);
  return updatedSubscription;
}

async function reactivateSubscription(owner) {
  let user = await usersService.findUserById(owner);
  let updatedSubscription = await stripeService.reactivateSubscriptionBeforeEndOfCurrentBillingPeriod(user.stripeSubscriptionId);
  return updatedSubscription;
}

export default {
  findSubscriptionByOwner,
  processStripeSubscription,
  resetCertificatesLimitCounter,
  setCertificateLimitCounter,
  cancelSubscription,
  reactivateSubscription
}