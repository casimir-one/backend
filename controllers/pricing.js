import config from './../config';
import subscriptionsService from './../services/subscriptions';
import pricingPlansService from './../services/pricingPlans';
import stripeService from './../services/stripe';

const getUserSubscription = async function (ctx) {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  try {

    if (username != jwtUsername) {
      ctx.status = 403;
      ctx.body = `You don't have access to ${jwtUsername} subscriptions info`;
      return;
    }

    let subscription = await subscriptionsService.findSubscriptionByOwner(username);
    let pricingPlan = await pricingPlansService.findPricingPlan(subscription ? subscription.plan.nickname : "free");
    
    if (subscription && subscription.status == 'canceled') {
      ctx.status = 200;
      ctx.body = { subscription: null, pricingPlan }
      return;
    }

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
      productName,
      planId, 
      planName, 
      planAmount, 
      planInterval, 
      planIntervalCount 
    } = ctx.request.body;

    let result = await subscriptionsService.processStripeSubscription(jwtUsername, { stripeToken, customerEmail, planId, planName });

    ctx.status = 200;
    ctx.body = result;

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


// Stripe Webhooks

// See https://stripe.com/docs/api/subscriptions/object#subscription_object-status
const incomplete = "incomplete";
const incomplete_expired = "incomplete_expired"
const trialing = "trialing";
const active = "active";
const past_due = "past_due"
const canceled = "canceled";
const unpaid = "unpaid";

const customerSubscriptionCreatedWebhook = async function (ctx) {

  try {
    const sig = ctx.request.headers['stripe-signature'];
    const endpointSecret = config.stripe.customerSubscriptionCreatedWebhookSigningKey;

    let event;
    try {
      event = stripeService.constructEventFromWebhook({ body: ctx.request.rawBody, sig, endpointSecret });
    } catch (err) {
      console.log(err);
      ctx.status = 400
      ctx.body = `Webhook Error: ${err.message}`;
      return;
    }

    let { data: { object: { id, customer, status } } } = event;

    console.log(status);

    if (status == incomplete) {
      // this can be related to 3D Secure or insufficient balance
    } else if (status == active) {
      // TODO: Send email to info@deip.world to notify DEIP team about newcomer
      let stripeCustomer = await stripeService.findCustomer(customer);
      console.log(stripeCustomer);
      console.log("8888888********4444");
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
    }
    catch (err) {
      console.log(err);
      ctx.status = 400
      ctx.body = `Webhook Error: ${err.message}`;
      return;
    }

    let { object, previous_attributes } = event.data;

    console.log(object);
    console.log(previous_attributes);

    console.log("---------------------------------");

    let currentStatus = object.status;
    let previousStatus = previous_attributes.status;

    console.log(currentStatus);
    console.log(previousStatus);

    console.log("---------------------------------");


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
  processStripePayment,
  cancelStripeSubscription,
  reactivateSubscription,

  customerSubscriptionCreatedWebhook,
  customerSubscriptionUpdatedWebhook
}