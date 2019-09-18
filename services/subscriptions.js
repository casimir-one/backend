import pricingPlansService from './../services/pricingPlans';
import stripeService from './../services/stripe';
import usersService from './../services/users';
import { FREE_PRICING_PLAN_ID, UNLIMITED_PRICING_PLAN_ID } from './../common/constants';

async function findSubscriptionByOwner(owner) {
  const subscription = {
    id: null,
    pricingPlanId: null,
    isLimitedPlan: true,
    isActive: false,
    availableCertificatesBySubscription: 0,
    availableContractsBySubscription: 0,
    availableFilesSharesBySubscription: 0,
    availableAdditionalCertificates: 0,
    isWaitingFor3DSecure: null,
    isPaymentFailed: null,
    isCanceling: null,
    currentPeriodEnd: null,
  };

  const user = await usersService.findUserById(owner);
  if (!user.stripeSubscriptionId) {
    if (user.appPricingPlanId === UNLIMITED_PRICING_PLAN_ID) {
      subscription.pricingPlanId = UNLIMITED_PRICING_PLAN_ID;
      subscription.isLimitedPlan = false;
      subscription.isActive = true;
    } else if (user.appPricingPlanId === FREE_PRICING_PLAN_ID) {
      subscription.pricingPlanId = FREE_PRICING_PLAN_ID;
      subscription.isLimitedPlan = true;
      subscription.isActive = false;
    }
  } else {
    const stripeSubscription = await stripeService.findSubscription(user.stripeSubscriptionId);
    if (stripeSubscription.latest_invoice) {
      stripeSubscription.latestInvoice = await stripeService.findInvoice(stripeSubscription.latest_invoice);
      if (stripeSubscription.latestInvoice.payment_intent) {
        stripeSubscription.latestInvoice.paymentIntent = await stripeService.findPaymentIntent(stripeSubscription.latestInvoice.payment_intent);
      }
    }

    subscription.id = stripeSubscription.id;
    subscription.pricingPlanId = stripeSubscription.plan.nickname;
    subscription.isLimitedPlan = true;
    subscription.isActive = ['active', 'past_due', 'trialing'].includes(stripeSubscription.status); // subscription becomes past_due when the first attempt to renew it fails
    subscription.availableCertificatesBySubscription = parseInt(stripeSubscription.metadata.availableCertificatesBySubscription) || 0;
    subscription.availableContractsBySubscription = parseInt(stripeSubscription.metadata.availableContractsBySubscription) || 0;
    subscription.availableFilesSharesBySubscription = parseInt(stripeSubscription.metadata.availableFilesSharesBySubscription) || 0;
    subscription.availableAdditionalCertificates = parseInt(stripeSubscription.metadata.availableAdditionalCertificates) || 0;
    subscription.isWaitingFor3DSecure = (
      stripeSubscription.status === 'incomplete'
      && stripeSubscription.latestInvoice && stripeSubscription.latestInvoice.status === 'open'
      && stripeSubscription.latestInvoice.paymentIntent && stripeSubscription.latestInvoice.paymentIntent.status === 'requires_action'
    );
    subscription.isPaymentFailed = (
      (stripeSubscription.status === 'incomplete_expired')
      || (
        stripeSubscription.status === 'incomplete' && 
        stripeSubscription.latestInvoice && stripeSubscription.latestInvoice.status === 'open' &&
        stripeSubscription.latestInvoice.paymentIntent && stripeSubscription.latestInvoice.paymentIntent.status === 'requires_payment_method'
      )
    );
    subscription.isCanceling = stripeSubscription.cancel_at_period_end;
    subscription.currentPeriodEnd = stripeSubscription.current_period_end;
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
      availableCertificatesBySubscription: 0,
      availableContractsBySubscription: 0,
      availableFilesSharesBySubscription: 0,
    }
  });

  await usersService.updateStripeInfo(owner, customerId, subscription.id, planId);
  if (subscription.latest_invoice.payment_intent.status == "succeeded") {
    await setSubscriptionCounters(subscription.id, {
      certificates: pricingPlan.terms.certificateLimit.limit,
      contracts: pricingPlan.terms.contractLimit.limit,
      filesShares: pricingPlan.terms.fileShareLimit.limit,
    });
  }

  return subscription.latest_invoice.payment_intent.status;
}

async function setSubscriptionCounters(id, {
  certificates, contracts, filesShares, additionalCertificates,
}) {
  const metadataToUpdate = {};
  if (certificates !== undefined) {
    metadataToUpdate.availableCertificatesBySubscription = certificates;
  }
  if (contracts !== undefined) {
    metadataToUpdate.availableContractsBySubscription = contracts;
  }
  if (filesShares !== undefined) {
    metadataToUpdate.availableFilesSharesBySubscription = filesShares;
  }
  if (additionalCertificates !== undefined) {
    metadataToUpdate.availableAdditionalCertificates = additionalCertificates;
  }

  let updatedSubscription = await stripeService.updateSubscription(id, { metadata: metadataToUpdate });
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
  cancelSubscription,
  reactivateSubscription,
  setSubscriptionCounters,
}