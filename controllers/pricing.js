import config from './../config';
import subscriptionsService from './../services/subscriptions';
import pricingPlansService from './../services/pricingPlans';
import stripeService from './../services/stripe';
import usersService from './../services/users';
import util from 'util';

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
      console.log(util.inspect(event, { depth: null }))
    } catch (err) {
      console.log(err);
      ctx.status = 400
      ctx.body = `Webhook Error: ${err.message}`;
      return;
    }

    let { data: { object: { id, customer, status } } } = event;
    if (status == incomplete) {
      // this can be related to 3D Secure or insufficient balance
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
      object: { id, customer, cancel_at_period_end: currentCancelAtPeriodEnd, status: currentStatus }, 
      previous_attributes: { status: previousStatus, cancel_at_period_end: previousCancelAtPeriodEnd } 
    } = event.data;


    if (previousStatus != active && currentStatus == active) {
      let stripeCustomer = await stripeService.findCustomer(customer);
      let stripeSubsctiption = await stripeService.findSubscription(id);
      // TODO: we need to be sure UserProfile email is consistent with Stripe customer email, 
      // we need to add a check in user controller to update stripe cusomer email if profile email changes
      let userProfile = await usersService.findUserByEmail(stripeCustomer.email);
      await usersService.updateStripeInfo(userProfile._id, customer, stripeSubsctiption.id, stripeSubsctiption.plan.id);

      if (previousStatus == incomplete) {
        // subscription is activated after 3D Secure confirmation or other delays
        let to = stripeCustomer.email;
        console.log(`TODO: Send product Greeting letter`);
      }

    } else if (previousStatus == active && currentStatus == past_due) {
      //  Payment for this subscription has failed first time
      let stripeCustomer = await stripeService.findCustomer(customer);
      let stripeSubsctiption = await stripeService.findSubscription(id);
      let to = stripeCustomer.email;
      console.log(`TODO: Send letter with notification of payment failure (first attempt)`);
    } else if (previousCancelAtPeriodEnd != currentCancelAtPeriodEnd && currentCancelAtPeriodEnd === true) {
      // subscription is canceled
      let stripeCustomer = await stripeService.findCustomer(customer);
      let stripeSubsctiption = await stripeService.findSubscription(id);
      let to = stripeCustomer.email;
      console.log(`TODO: Send letter with notification of subscription cancelation date`);
    } else if (previousCancelAtPeriodEnd != currentCancelAtPeriodEnd && currentCancelAtPeriodEnd === false) {
      // subscription is reactivated
      let stripeCustomer = await stripeService.findCustomer(customer);
      let stripeSubsctiption = await stripeService.findSubscription(id);
      let to = stripeCustomer.email;
      console.log(`TODO: Send letter with notification of subscription reactivation`);
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
  processStripePayment,
  cancelStripeSubscription,
  reactivateSubscription,

  customerSubscriptionCreatedWebhook,
  customerSubscriptionUpdatedWebhook
}