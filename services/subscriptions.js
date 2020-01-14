import deipRpc from '@deip/deip-rpc-client';
import config from './../config';
import pricingPlansService from './../services/pricingPlans';
import stripeService from './../services/stripe';
import usersService from './../services/users';
import { signOperation, sendTransaction } from './../utils/blockchain';
import { FREE_PRICING_PLAN_ID, UNLIMITED_PRICING_PLAN_ID } from './../common/constants';
import { stripeSubscriptionStatus } from './../common/enums';

async function findSubscriptionByOwner(owner) {
  const subscription = {
    id: null,
    pricingPlanId: null,
    stripePricingPlanId: null,
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
    currentPeriodStart: null,
    currentPeriodEnd: null,
    discount: null,
    isFirstMonthFree: false,
  };

  const group = await deipRpc.api.getResearchGroupByPermlinkAsync(owner);
  const [user, bcSubscription] = await Promise.all([
    usersService.findUserById(owner),
    deipRpc.api.getSubscriptionByResearchGroupIdAsync(group.id),
  ]);
  subscription.availableCertificatesBySubscription = bcSubscription.current_file_certificate_quota_units;
  subscription.availableContractsBySubscription = bcSubscription.current_nda_contract_quota_units;
  subscription.availableFilesSharesBySubscription = bcSubscription.current_nda_protected_file_quota_units;
  subscription.availableAdditionalCertificates = bcSubscription.extra_file_certificate_quota_units;
  subscription.availableAdditionalContracts = bcSubscription.extra_nda_contract_quota_units;
  subscription.availableAdditionalFilesShares = bcSubscription.extra_nda_protected_file_quota_units;
  if (!user.stripeSubscriptionId) {
    if (user.appPricingPlanId === UNLIMITED_PRICING_PLAN_ID) {
      subscription.pricingPlanId = UNLIMITED_PRICING_PLAN_ID;
      subscription.isLimitedPlan = false;
      subscription.isActive = true;
    } else if (user.appPricingPlanId === FREE_PRICING_PLAN_ID) {
      subscription.pricingPlanId = FREE_PRICING_PLAN_ID;
      subscription.isLimitedPlan = true;
      subscription.isActive = true;
    }
  } else {
    const stripeSubscription = await stripeService.findSubscription(user.stripeSubscriptionId);
    if (stripeSubscription.latest_invoice) {
      stripeSubscription.latestInvoice = await stripeService.findInvoice(stripeSubscription.latest_invoice);
      if (stripeSubscription.latestInvoice.payment_intent) {
        stripeSubscription.latestInvoice.paymentIntent = await stripeService.findPaymentIntent(stripeSubscription.latestInvoice.payment_intent);
      }
      if (
        stripeSubscription.latestInvoice.billing_reason === 'subscription_create'
        && stripeSubscription.latestInvoice.amount_due === 0
      ) {
        subscription.isFirstMonthFree = true;
      }
    }

    subscription.id = stripeSubscription.id;
    subscription.pricingPlanId = stripeSubscription.plan.nickname;
    subscription.stripePricingPlanId = stripeSubscription.plan.id;
    subscription.isLimitedPlan = true;
    subscription.isActive = [stripeSubscriptionStatus.ACTIVE, stripeSubscriptionStatus.TRIALING].includes(stripeSubscription.status);
    subscription.isTrialing = stripeSubscription.status === stripeSubscriptionStatus.TRIALING;
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
    // stripe dates are in seconds
    subscription.currentPeriodStart = stripeSubscription.current_period_start * 1000;
    subscription.currentPeriodEnd = stripeSubscription.current_period_end * 1000;
    if (stripeSubscription.discount) {
      subscription.discount = {
        amountOff: stripeSubscription.discount.coupon.amount_off,
        percentOff: stripeSubscription.discount.coupon.percent_off,
      };
    }
  }

  return subscription;
}

async function processStripeSubscription(owner, { stripeToken, planId, coupon }) {
  const user = await usersService.findUserById(owner);
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripeService.createCustomer({
      stripeToken,
      customerEmail: user.email,
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
    coupon,
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
    status = (subscription.latest_invoice.paid && !subscription.latest_invoice.payment_intent) // 100% discount is applied
      ? 'succeeded'
      : subscription.latest_invoice.payment_intent.status;
    if (status === "succeeded") {
      await setSubscriptionQuota(owner, {
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

// upgrade or renew the subscription according to its pricing plan
async function setSubscriptionQuota(owner, {
  certificates, contracts, filesShares,
}) {
  const [group, subscription] = await Promise.all([
    deipRpc.api.getResearchGroupByPermlinkAsync(owner),
    findSubscriptionByOwner(owner)
  ]);
  const bcSubscription = await deipRpc.api.getSubscriptionByResearchGroupIdAsync(group.id);

  const quotas = {
    external_id: subscription.id,
    external_plan_id: subscription.stripePricingPlanId,
    billing_date: (new Date(subscription.currentPeriodStart)).toISOString().split('.')[0],
  };

  if (certificates !== undefined) {
    quotas.file_certificate_quota = certificates; // pricing plan quota
    quotas.current_file_certificate_quota_units = certificates; // currently used quota
  }
  if (contracts !== undefined) {
    quotas.nda_contract_quota = contracts; // pricing plan quota
    quotas.current_nda_contract_quota_units = contracts; // currently used quota
  }
  if (filesShares !== undefined) {
    quotas.nda_protected_file_quota = filesShares; // pricing plan quota
    quotas.current_nda_protected_file_quota_units = filesShares; // currently used quota
  }
  const update_subscription_op = {
    owner,
    agent: config.blockchain.accountsCreator.username,
    subscription_id: bcSubscription.id,
    json_data: JSON.stringify(quotas)
  };
  const operations = [
    ["update_subscription", update_subscription_op]
  ];
  const signedTx = await signOperation(operations, config.blockchain.accountsCreator.wif);
  await sendTransaction(signedTx);
}

async function adjustSubscriptionExtraQuota(owner, {
  additionalCertificates, additionalContracts, additionalFilesShares,
}) {
  const group = await deipRpc.api.getResearchGroupByPermlinkAsync(owner);
  const bcSubscription = await deipRpc.api.getSubscriptionByResearchGroupIdAsync(group.id);

  const quotas = {};
  if (additionalCertificates !== undefined) {
    quotas.extra_file_certificate_quota_units = additionalCertificates;
  }
  if (additionalContracts !== undefined) {
    quotas.extra_nda_contract_quota_units = additionalContracts;
  }
  if (additionalFilesShares !== undefined) {
    quotas.extra_nda_protected_file_quota_units = additionalFilesShares;
  }
  const adjust_subscription_extra_quota = {
    owner,
    agent: config.blockchain.accountsCreator.username,
    subscription_id: bcSubscription.id,
    json_data: JSON.stringify(quotas)
  };
  const operations = [
    ["adjust_subscription_extra_quota", adjust_subscription_extra_quota]
  ];
  const signedTx = await signOperation(operations, config.blockchain.accountsCreator.wif);
  await sendTransaction(signedTx);
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
  setSubscriptionQuota,
  adjustSubscriptionExtraQuota,
  changeSubscription
}