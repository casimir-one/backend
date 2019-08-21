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
  if (subscription.latest_invoice) {
    subscription.latestInvoice = await stripeService.findInvoice(subscription.latest_invoice);
    if (subscription.latestInvoice.payment_intent) {
      subscription.latestInvoice.paymentIntent = await stripeService.findPaymentIntent(subscription.latestInvoice.payment_intent);
    }
  }

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
  } else {
    await stripeService.updateCustomer(customerId, {
      sourceCardToken: stripeToken
    })
  }

  const pricingPlan = await pricingPlansService.findPricingPlanByStripeId(planId);
  const subscription = await stripeService.createSubscription(customerId, {
    planId,
    metadata: {
      availableCertificatesBySubscription: 0
    }
  });

  await usersService.updateStripeInfo(owner, customerId, subscription.id, planId);
  if (subscription.latest_invoice.payment_intent.status == "succeeded") {
    await setAvailableCertificatesCounter(subscription.id, pricingPlan.terms.certificateLimit.limit);
  }

  return subscription.latest_invoice.payment_intent.status;
}

async function setAvailableCertificatesCounter(id, value) {
  let updatedSubscription = await stripeService.updateSubscription(id, { metadata: { availableCertificatesBySubscription: value } });
  return updatedSubscription;
}

async function setAvailableAdditionalCertificatesCounter(id, value) {
  let updatedSubscription = await stripeService.updateSubscription(id, { metadata: { availableAdditionalCertificates: value } });
  return updatedSubscription;
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
  setAvailableCertificatesCounter,
  setAvailableAdditionalCertificatesCounter,
  cancelSubscription,
  reactivateSubscription
}