import config from './../config';
import subscriptionsService from './../services/subscriptions';
import pricingPlansService from './../services/pricingPlans';
import additionalPackagesService from './../services/additionalPackages';
import stripeService from './../services/stripe';
import usersService from './../services/users';
import util from 'util';
import _ from 'lodash';
import { FREE_PRICING_PLAN_ID } from './../common/constants';
import bluebird from 'bluebird';
import subscriptions from './../services/subscriptions';

const {
  additionalPackageType,
  additionalPackageTypeValues,
  stripeSubscriptionStatus
} = require('./../common/enums');

const getUserSubscription = async function (ctx) {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  try {

    if (username != jwtUsername) {
      ctx.status = 403;
      ctx.body = `You don't have access to ${jwtUsername} subscriptions info`;
      return;
    }

    const subscription = await subscriptionsService.findSubscriptionByOwner(username);
    let pricingPlan = await pricingPlansService.findPricingPlan(subscription.pricingPlanId);
    
    ctx.status = 200;
    ctx.body = { subscription, pricingPlan };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getRegularPricingPlans = async function (ctx) {
  const jwtUsername = ctx.state.user.username;

  try {

    let regularPricingPlans = await pricingPlansService.findRegularPricingPlans();
    ctx.status = 200;
    ctx.body = regularPricingPlans;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const processStripePayment = async function (ctx) {
  const jwtUsername = ctx.state.user.username;

  try {
    let {
      stripeToken,
      planId,
    } = ctx.request.body;

    let regularPricingPlans = await pricingPlansService.findRegularPricingPlans();
    if (!regularPricingPlans.some(p => p.stripePlan.id == planId)) {
      ctx.status = 400;
      ctx.body = `Plan ${planId} is not a regular one`;
      return;
    }

    ctx.status = 200;
    ctx.body = await subscriptionsService.processStripeSubscription(jwtUsername, { stripeToken, planId });
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const cancelStripeSubscription = async function (ctx) {
  const jwtUsername = ctx.state.user.username;

  try {
    let result = await subscriptionsService.cancelSubscription(jwtUsername);
    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const reactivateSubscription = async function (ctx) {
  const jwtUsername = ctx.state.user.username;

  try {
    await subscriptionsService.reactivateSubscription(jwtUsername);
    ctx.status = 204;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const changeSubscription = async function (ctx) {
  const jwtUsername = ctx.state.user.username;

  try {
    const { planId } = ctx.request.body;

    await subscriptionsService.changeSubscription(jwtUsername, planId);
    ctx.status = 204;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getBillingSettings = async function (ctx) {
  const username = ctx.state.user.username;

  try {
    const user = await usersService.findUserById(username);

    const customerInfo = await stripeService.findCustomer(user.stripeCustomerId);

    ctx.status = 200;
    ctx.body = {
      defaultCard: {
        brand: customerInfo.default_source.brand,
        expMonth: customerInfo.default_source.exp_month,
        expYear: customerInfo.default_source.exp_year,
        last4: customerInfo.default_source.last4,
      }
    };
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const updateBillingCard = async function (ctx) {
  const username = ctx.state.user.username;

  const sourceCardToken = ctx.request.body;
  try {
    const user = await usersService.findUserById(username);
    await stripeService.updateCustomer(user.stripeCustomerId, {
      sourceCardToken: sourceCardToken.id
    });

    ctx.status = 204;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const buyAdditionalPackage = async function (ctx) {
  const jwtUsername = ctx.state.user.username;
  const packageId = ctx.params.id;

  try {
    const subscription = await subscriptionsService.findSubscriptionByOwner(jwtUsername);
    if (!subscription.isActive || subscription.pricingPlanId === FREE_PRICING_PLAN_ID) {
      ctx.status = 402;
      ctx.body = `Subscription for ${jwtUsername} has expired`;
      return;
    }
    const [user, additionalPackage] = await Promise.all([
      usersService.findUserById(jwtUsername),
      additionalPackagesService.findAdditionalPackageById(packageId)
    ]);
    const customerInfo = await stripeService.findCustomer(user.stripeCustomerId);
    const intent = await stripeService.createPaymentIntent({
      amount: additionalPackage.price,
      customerId: user.stripeCustomerId,
      paymentMethod: customerInfo.default_source.id,
      metadata: {
        object: additionalPackage.type,
        username: jwtUsername,
        numberOfUnits: additionalPackage.numberOfUnits,
      },
    });

    ctx.status = 200;
    ctx.body = {
      clientSecret: intent.client_secret,
    };
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const getAdditionalPackages = async function (ctx) {
  try {
    ctx.status = 200;
    ctx.body = await additionalPackagesService.findAdditionalPackages({ active: true });
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};


// Stripe Webhooks


const customerSubscriptionCreatedWebhook = async function (ctx) {

  try {
    const sig = ctx.request.headers['stripe-signature'];
    const endpointSecret = config.stripe.customerSubscriptionCreatedWebhookSigningKey;

    let event;
    try {
      event = stripeService.constructEventFromWebhook({ body: ctx.request.rawBody, sig, endpointSecret });
      console.log(util.inspect(event, { depth: null }))
    } catch (err) {
      console.log(err);
      ctx.status = 400
      ctx.body = `Webhook Error: ${err.message}`;
      return;
    }

    let { data: { object: { id, customer, status } } } = event;
    if (status === stripeSubscriptionStatus.INCOMPLETE) {
      // this is usually related to 3D Secure
    } else if (status === stripeSubscriptionStatus.ACTIVE) {
      console.log(`TODO: Send email to info@deip.world to notify DEIP team about new account`);
      let stripeCustomer = await stripeService.findCustomer(customer);
      let to = stripeCustomer.email;
      console.log(`TODO: Send product Greeting letter`);
    }

    ctx.status = 200;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const customerSubscriptionUpdatedWebhook = async function (ctx) {
  
  try {
    const sig = ctx.request.headers['stripe-signature'];
    const endpointSecret = config.stripe.customerSubscriptionUpdatedWebhookSigningKey;

    let event;
    try {
      event = stripeService.constructEventFromWebhook({ body: ctx.request.rawBody, sig, endpointSecret });
      console.log(util.inspect(event, {depth: null}))
    } catch (err) {
      console.log(err);
      ctx.status = 400;
      ctx.body = `Webhook Error: ${err.message}`;
      return;
    }

    let { 
      object: {
        id,
        customer,
        status: currentStatus,
        cancel_at_period_end: currentCancelAtPeriodEnd,
        current_period_end: currentCurrentPeriodEnd
      },
      previous_attributes: {
        status: previousStatus,
        cancel_at_period_end: previousCancelAtPeriodEnd,
        current_period_end: previousCurrentPeriodEnd
      }
    } = event.data;

    const stripeCustomer = await stripeService.findCustomer(customer);
    if (config.environment !== 'local' && stripeCustomer.metadata.type === 'local') {
      ctx.status = 200;
      return;
    }
    const user = await usersService.findUserByCustomerId(customer);
    if (!user) {
      ctx.status = 400;
      return;
    }
    if (
      previousStatus !== undefined
      && [stripeSubscriptionStatus.INCOMPLETE].includes(previousStatus)
      && currentStatus === stripeSubscriptionStatus.ACTIVE
    ) {
      /**
       * subscription is activated after creation and user action required
       */
      let pricingPlan = await pricingPlansService.findPricingPlanByStripeId(stripeSubscription.plan.id);
      await subscriptionsService.setSubscriptionQuota(user._id, {
        certificates: pricingPlan.terms.certificateLimit.limit,
        contracts: pricingPlan.terms.contractLimit.limit,
        filesShares: pricingPlan.terms.fileShareLimit.limit,
      });
      
      let to = stripeCustomer.email;
      console.log(`TODO: Send product Greeting letter`);
    } else if (previousStatus !== undefined && previousStatus === stripeSubscriptionStatus.ACTIVE && currentStatus === stripeSubscriptionStatus.PAST_DUE) {
      //  Payment for this subscription has failed first time
      let stripeSubscription = await stripeService.findSubscription(id);
      let to = stripeCustomer.email;
      console.log(`TODO: Send letter with notification about payment failure (first attempt)`);
    }

    
    if (previousCancelAtPeriodEnd !== undefined && previousCancelAtPeriodEnd != currentCancelAtPeriodEnd && currentCancelAtPeriodEnd === true) {
      // subscription is canceled
      let stripeSubscription = await stripeService.findSubscription(id);
      let to = stripeCustomer.email;
      console.log(`TODO: Send letter with notification about subscription cancelation date`);
    } else if (previousCancelAtPeriodEnd !== undefined && previousCancelAtPeriodEnd != currentCancelAtPeriodEnd && currentCancelAtPeriodEnd === false) {
      // subscription is reactivated
      let stripeSubscription = await stripeService.findSubscription(id);
      let to = stripeCustomer.email;
      console.log(`TODO: Send letter with notification about subscription reactivation`);
    }


    if (
      previousCurrentPeriodEnd !== undefined
      && previousCurrentPeriodEnd !== currentCurrentPeriodEnd
    ) {
      /**
       * in cases when:
       * - subscription is renewed
       * - subscription is updated
       * - after trial is ended
       */
      let stripeSubscription = await stripeService.findSubscription(id);
      let pricingPlan = await pricingPlansService.findPricingPlanByStripeId(stripeSubscription.plan.id);
      await subscriptionsService.setSubscriptionQuota(user._id, {
        certificates: pricingPlan.terms.certificateLimit.limit,
        contracts: pricingPlan.terms.contractLimit.limit,
        filesShares: pricingPlan.terms.fileShareLimit.limit,
      });
      console.log(`TODO: Send letter with notification about subscription info`);
    }

    ctx.status = 200;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const customerPaymentIntentSucceededWebhook = async function (ctx) {
  try {
    const sig = ctx.request.headers['stripe-signature'];
    const endpointSecret = config.stripe.customerPaymentIntentSucceededWebhookSigningKey;

    try {
      const event = stripeService.constructEventFromWebhook({ body: ctx.request.rawBody, sig, endpointSecret });
      const stripeCustomer = await stripeService.findCustomer(event.data.object.customer);
      if (config.environment !== 'local' && stripeCustomer.metadata.type === 'local') {
        ctx.status = 200;
        return;
      }
      const { object, username, numberOfUnits } = event.data.object.metadata;
      if (!additionalPackageTypeValues.includes(object)) {
        ctx.status = 200;
        return;
      }
      const numberOfUnitsToAdd = parseInt(numberOfUnits) || 0;
      let updatedSubscriptionCounters = {};
      switch (object) {
        case additionalPackageType.CERTIFICATES:
          updatedSubscriptionCounters = {
            additionalCertificates: numberOfUnitsToAdd,
          };
          break;
        case additionalPackageType.CONTRACTS:
          updatedSubscriptionCounters = {
            additionalContracts: numberOfUnitsToAdd,
          };
          break;
        case additionalPackageType.FILES_SHARES:
          updatedSubscriptionCounters = {
            additionalFilesShares: numberOfUnitsToAdd,
          };
          break;
      }
      if (!_.isEmpty(updatedSubscriptionCounters)) {
        await subscriptionsService.adjustSubscriptionExtraQuota(username, updatedSubscriptionCounters);
      }
    } catch (err) {
      console.log(err);
      ctx.status = 400;
      ctx.body = `Webhook Error: ${err.message}`;
      return;
    }

    ctx.status = 200;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

export default {
  getUserSubscription,
  getRegularPricingPlans,
  getBillingSettings,
  updateBillingCard,
  processStripePayment,
  cancelStripeSubscription,
  reactivateSubscription,
  changeSubscription,
  getAdditionalPackages,
  buyAdditionalPackage,

  customerSubscriptionCreatedWebhook,
  customerSubscriptionUpdatedWebhook,
  customerPaymentIntentSucceededWebhook
}