import config from './../config';
import subscriptionsService from './../services/subscriptions';
import pricingPlansService from './../services/pricingPlans';

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
    if (!subscription) {
      ctx.status = 404;
      ctx.body = `Subscription for ${username} is not found`;
      return;
    }

    let pricingPlan = await pricingPlansService.findPricingPlan(subscription.pricingPlan);

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


export default {
  getUserSubscription,
  getRegularPricingPlans
}