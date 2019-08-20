import config from './../config';
import subscriptionsService from './../services/subscriptions';
import pricingPlansService from './../services/pricingPlans';
import stripeService from './../services/stripe';
import usersService from './../services/users';
import util from 'util';
import bluebird from 'bluebird';

// See https://stripe.com/docs/api/subscriptions/object#subscription_object-status
const incomplete = "incomplete";
const incomplete_expired = "incomplete_expired"
const trialing = "trialing";
const active = "active";
const past_due = "past_due"
const canceled = "canceled";
const unpaid = "unpaid";


const getUserSubscription = async function (ctx) {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  try {

    if (username != jwtUsername) {
      ctx.status = 403;
      ctx.body = `You don't have access to ${jwtUsername} subscriptions info`;
      return;
    }

    let pricingPlanId = "free";
    let subscription = await subscriptionsService.findSubscriptionByOwner(username);
    if (subscription) {
      pricingPlanId = subscription.plan.nickname;
    } else {
      let user = await usersService.findUserById(jwtUsername);
      pricingPlanId = user.appPricingPlanId || pricingPlanId;
    }

    let pricingPlan = await pricingPlansService.findPricingPlan(pricingPlanId);
    
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
      customerEmail,
      planId,
    } = ctx.request.body;

    let regularPricingPlans = await pricingPlansService.findRegularPricingPlans();
    if (!regularPricingPlans.some(p => p.stripePlan.id == planId)) {
      ctx.status = 400;
      ctx.body = `Plan ${planId} is not a regular one`;
      return;
    }

    ctx.status = 200;
    ctx.body = await subscriptionsService.processStripeSubscription(jwtUsername, { stripeToken, customerEmail, planId });

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
    let result = await subscriptionsService.reactivateSubscription(jwtUsername);
    ctx.status = 200;
    ctx.body = result;

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
    if (status == incomplete) {
      // this is usually related to 3D Secure
    } else if (status == active) {
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
      object: { id, customer, status: currentStatus, cancel_at_period_end: currentCancelAtPeriodEnd, current_period_end: currentCurrentPeriodEnd }, 
      previous_attributes: { status: previousStatus, cancel_at_period_end: previousCancelAtPeriodEnd, current_period_end: previousCurrentPeriodEnd } 
    } = event.data;


    if (previousStatus !== undefined && previousStatus == incomplete && currentStatus == active) {
      // subscription is activated after 3D Secure confirmation
      let stripeSubscription = await stripeService.findSubscription(id);
      let pricingPlan = await pricingPlansService.findPricingPlanByStripeId(stripeSubscription.plan.id);
      await subscriptionsService.setAvailableCertificatesCounter(stripeSubscription.id, pricingPlan.terms.certificateLimit.limit);
      
      let stripeCustomer = await stripeService.findCustomer(customer);
      let to = stripeCustomer.email;
      console.log(`TODO: Send product Greeting letter`);
    } else if (previousStatus !== undefined && previousStatus == active && currentStatus == past_due) {
      //  Payment for this subscription has failed first time
      let stripeCustomer = await stripeService.findCustomer(customer);
      let stripeSubscription = await stripeService.findSubscription(id);
      let to = stripeCustomer.email;
      console.log(`TODO: Send letter with notification about payment failure (first attempt)`);
    }

    
    if (previousCancelAtPeriodEnd !== undefined && previousCancelAtPeriodEnd != currentCancelAtPeriodEnd && currentCancelAtPeriodEnd === true) {
      // subscription is canceled
      let stripeCustomer = await stripeService.findCustomer(customer);
      let stripeSubscription = await stripeService.findSubscription(id);
      let to = stripeCustomer.email;
      console.log(`TODO: Send letter with notification about subscription cancelation date`);
    } else if (previousCancelAtPeriodEnd !== undefined && previousCancelAtPeriodEnd != currentCancelAtPeriodEnd && currentCancelAtPeriodEnd === false) {
      // subscription is reactivated
      let stripeCustomer = await stripeService.findCustomer(customer);
      let stripeSubscription = await stripeService.findSubscription(id);
      let to = stripeCustomer.email;
      console.log(`TODO: Send letter with notification about subscription reactivation`);
    }


    if (previousCurrentPeriodEnd !== undefined && previousCurrentPeriodEnd != currentCurrentPeriodEnd) {
      // subscription renewal
      let stripeSubscription = await stripeService.findSubscription(id);
      let pricingPlan = await pricingPlansService.findPricingPlanByStripeId(stripeSubscription.plan.id);
      await subscriptionsService.setAvailableCertificatesCounter(stripeSubscription.id, pricingPlan.terms.certificateLimit.limit);
      console.log(`TODO: Send letter with notification about subscription info`);
    }

    ctx.status = 200;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

export default {
  getUserSubscription,
  getRegularPricingPlans,
  getBillingSettings,
  updateBillingCard,
  processStripePayment,
  cancelStripeSubscription,
  reactivateSubscription,

  customerSubscriptionCreatedWebhook,
  customerSubscriptionUpdatedWebhook
}