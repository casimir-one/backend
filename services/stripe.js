import config from './../config';
const stripe = require('stripe')(config.stripe.secretKey);

async function getIPprotectionProduct() {

  let product = await stripe.products.retrieve(config.stripe.ipProtectionProductId);
  let allPlans = await stripe.plans.list({});
  let productPlans = allPlans.data.filter(plan => {
    return plan.product === product.id;
  });

  return { product, plans: productPlans };
}

async function createCustomerAndSubscription({ stripeToken, customerEmail, planId, metadata }) {
  let customer = await stripe.customers.create({ source: stripeToken, email: customerEmail });
  let subscription = await stripe.subscriptions.create({ customer: customer.id, metadata, items: [{ plan: planId }] });  
  return { customer, subscription };
}

async function findSubscription(subscriptionId) {
  let subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

async function updateSubscription(id, update) {
  let updatedSubscription = await stripe.subscriptions.update(id, update);
  return updatedSubscription;
}

async function cancelSubscriptionAtEndOfCurrentBillingPeriod(id) {
  let updatedSubscription = await stripe.subscriptions.update(id, { cancel_at_period_end: true });
  return updatedSubscription;
}

async function reactivateSubscriptionBeforeEndOfCurrentBillingPeriod(id) {
  let updatedSubscription = await stripe.subscriptions.update(id, { cancel_at_period_end: false });
  return updatedSubscription;
}

async function getSubscriptions() {
  let subscriptions = await stripe.subscriptions.list({});
  return subscriptions.data;
}

export default {
  getIPprotectionProduct,
  createCustomerAndSubscription,
  findSubscription,
  updateSubscription,
  getSubscriptions,
  cancelSubscriptionAtEndOfCurrentBillingPeriod,
  reactivateSubscriptionBeforeEndOfCurrentBillingPeriod
}
