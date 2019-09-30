import pricingPlansService from './../services/pricingPlans';
import stripeService from './../services/stripe';
import usersService from './../services/users';
import { FREE_PRICING_PLAN_ID, UNLIMITED_PRICING_PLAN_ID } from './../common/constants';
import { stripeSubscriptionStatus } from './../common/enums';

async function findSubscriptionByOwner(owner) {
  const subscription = {
    id: null,
    pricingPlanId: null,
    isLimitedPlan: true,
    isActive: false,
    isTrialing: false,
    availableCertificatesBySubscription: 0,
    availableContractsBySubscription: 0,
    availableFilesSharesBySubscription: 0,
    availableAdditionalCertificates: 0,
    availableAdditionalContracts: 0,
    availableAdditionalFilesShares: 0,
    isWaitingFor3DSecure: null,
    isPaymentFailed: null,
    isCanceling: null,
    currentPeriodEnd: null,
    discount: null,
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
      subscription.isActive = true;
      subscription.availableCertificatesBySubscription = user.freeUnits.certificates;
      subscription.availableContractsBySubscription = user.freeUnits.contracts;
      subscription.availableFilesSharesBySubscription = user.freeUnits.fileShares;
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
    subscription.isActive = [stripeSubscriptionStatus.ACTIVE, stripeSubscriptionStatus.TRIALING].includes(stripeSubscription.status);
    subscription.isTrialing = stripeSubscription.status === stripeSubscriptionStatus.TRIALING;
    subscription.availableCertificatesBySubscription = parseInt(stripeSubscription.metadata.availableCertificatesBySubscription) || 0;
    subscription.availableContractsBySubscription = parseInt(stripeSubscription.metadata.availableContractsBySubscription) || 0;
    subscription.availableFilesSharesBySubscription = parseInt(stripeSubscription.metadata.availableFilesSharesBySubscription) || 0;
    subscription.availableAdditionalCertificates = parseInt(stripeSubscription.metadata.availableAdditionalCertificates) || 0;
    subscription.availableAdditionalContracts = parseInt(stripeSubscription.metadata.availableAdditionalContracts) || 0;
    subscription.availableAdditionalFilesShares = parseInt(stripeSubscription.metadata.availableAdditionalFilesShares) || 0;
    subscription.isWaitingFor3DSecure = (
      stripeSubscription.status === stripeSubscriptionStatus.INCOMPLETE
      && stripeSubscription.latestInvoice && stripeSubscription.latestInvoice.status === 'open'
      && stripeSubscription.latestInvoice.paymentIntent && stripeSubscription.latestInvoice.paymentIntent.status === 'requires_action'
    );
    subscription.isPaymentFailed = (
      (stripeSubscription.status === stripeSubscriptionStatus.INCOMPLETE_EXPIRED)
      || (
        stripeSubscription.status === stripeSubscriptionStatus.INCOMPLETE &&
        stripeSubscription.latestInvoice && stripeSubscription.latestInvoice.status === 'open' &&
        stripeSubscription.latestInvoice.paymentIntent && stripeSubscription.latestInvoice.paymentIntent.status === 'requires_payment_method'
      )
    );
    subscription.isCanceling = stripeSubscription.cancel_at_period_end;
    subscription.currentPeriodEnd = stripeSubscription.current_period_end;
    if (stripeSubscription.discount) {
      subscription.discount = {
        amountOff: stripeSubscription.discount.coupon.amount_off,
        percentOff: stripeSubscription.discount.coupon.percent_off,
      };
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
  const subscriptionData = {
    planId,
    metadata: {
      availableCertificatesBySubscription: 0,
      availableContractsBySubscription: 0,
      availableFilesSharesBySubscription: 0,
    }
  };
  // if (pricingPlan.trialTerms && pricingPlan.trialTerms.periodDays > 0) {
  //   subscriptionData.trialPeriodDays = pricingPlan.trialTerms.periodDays;
  //   subscriptionData.metadata.availableCertificatesBySubscription = pricingPlan.trialTerms.certificateLimit;
  //   subscriptionData.metadata.availableContractsBySubscription = pricingPlan.trialTerms.contractLimit;
  //   subscriptionData.metadata.availableFilesSharesBySubscription = pricingPlan.trialTerms.fileShareLimit;
  // }
  const subscription = await stripeService.createSubscription(customerId, subscriptionData);

  await usersService.updateStripeInfo(owner, customerId, subscription.id, planId);

  let status;
  let clientSecret = null;
  if (subscription.status === stripeSubscriptionStatus.TRIALING) {
    status = stripeSubscriptionStatus.TRIALING;
  } else {
    status = subscription.latest_invoice.payment_intent.status;
    if (subscription.latest_invoice.payment_intent.status === "succeeded") {
      await setSubscriptionCounters(subscription.id, {
        certificates: pricingPlan.terms.certificateLimit.limit,
        contracts: pricingPlan.terms.contractLimit.limit,
        filesShares: pricingPlan.terms.fileShareLimit.limit,
      });
    } else {
      clientSecret = subscription.latest_invoice.payment_intent.client_secret;
    }
  }

  return { status, clientSecret };
}

async function setSubscriptionCounters(id, {
  certificates, contracts, filesShares,
  additionalCertificates, additionalContracts, additionalFilesShares,
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
  if (additionalContracts !== undefined) {
    metadataToUpdate.availableAdditionalContracts = additionalContracts;
  }
  if (additionalFilesShares !== undefined) {
    metadataToUpdate.availableAdditionalFilesShares = additionalFilesShares;
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

async function changeSubscription(owner, newPlanId) {
  const [user, newPricingPlan] = await Promise.all([
    usersService.findUserById(owner),
    pricingPlansService.findPricingPlan(newPlanId),
  ]);
  let stripeSubscription = await stripeService.findSubscription(user.stripeSubscriptionId);
  const planItem = stripeSubscription.items.data.find(d => d.plan && d.plan.id === user.stripePricingPlanId);
  stripeSubscription = await stripeService.updateSubscription(user.stripeSubscriptionId, {
    items: [{
      id: planItem.id,
      plan: newPricingPlan.stripeId,
    }],
    coupon: '', // remove any discount if exists
    prorate: false,
    billing_cycle_anchor: 'now',
    trial_end: 'now', // if subscription is in trial mode
  })
  await usersService.updateStripeInfo(
    user._id,
    user.stripeCustomerId,
    user.stripeSubscriptionId,
    newPricingPlan.stripeId
  );
}

export default {
  findSubscriptionByOwner,
  processStripeSubscription,
  cancelSubscription,
  reactivateSubscription,
  setSubscriptionCounters,
  changeSubscription
}