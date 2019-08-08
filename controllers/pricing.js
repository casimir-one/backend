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

const customerSubscriptionUpdatedWebhook = async function (ctx) {
  try {
    console.log(ctx.request);
    console.log("-------TEST--------")
    console.log(ctx.request.body);

    const sig = ctx.request.headers['stripe-signature'];
    const endpointSecret = config.stripe.customerSubscriptionUpdatedWebhookSigningKey;

    let event;
    try {
      event = stripeService.constructEventFromWebhook({ body: ctx.request.body, sig, endpointSecret });
    }
    catch (err) {
      console.log(err);
      ctx.status = 400
      ctx.body = `Webhook Error: ${err.message}`;
      return;
    }

    console.log("EVENT");
    console.log(event);

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

  customerSubscriptionUpdatedWebhook
}