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

async function processStripeSubscription(owner, { stripeToken, customerEmail, planId }) {
  const user = await usersService.findUserById(owner);
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripeService.createCustomer({
      stripeToken, customerEmail
    });
    customerId = customer.id;
    await usersService.updateStripeInfo(owner, customerId, null, null);
  }

  const pricingPlan = await pricingPlansService.findPricingPlanByStripeId(planId);
  const subscription = await stripeService.createSubscription(customerId, {
    planId,
    metadata: {
      availableCertificatesBySubscription: pricingPlan.terms.certificateLimit.limit
    }
  });

  if (subscription.latest_invoice.payment_intent.status == "succeeded") {
    await usersService.updateStripeInfo(owner, customerId, subscription.id, planId);
  }

  return subscription.latest_invoice.payment_intent.status;
}

async function setCertificateLimitCounter(id, value) {
  let updatedSubscription = await stripeService.updateSubscription(id, { metadata: { availableCertificatesBySubscription: value } });
  return updatedSubscription;
}

async function resetCertificatesLimitCounter() {
  let subscriptions = await stripeService.getSubscriptions();
  // TODO: check pricing plan limit for subscription
  let pricingPlan = await pricingPlansService.findPricingPlan("standard-monthly");

  // TODO: Move this to stripe Webhook asap
  const promises = [];
  let endOfDay = moment().utc().endOf('day').toDate().toString();

  for (let i = 0; i < subscriptions.length; i++) {
    let subscription = subscriptions[i];
    let end = moment(subscription.current_period_end * 1000).utc().endOf('day').toDate().toString()
    if (endOfDay == end) {
      promises.push(stripeService.updateSubscription(subscription.id, { metadata: { availableCertificatesBySubscription: pricingPlan.terms.certificateLimit.limit } }));
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