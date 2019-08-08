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

async function createCustomerAndSubscription({ stripeToken, customerEmail, planId }) {
  let customer = await stripe.customers.create({ source: stripeToken, email: customerEmail });
  let subscription = await stripe.subscriptions.create({ customer: customer.id, items: [{ plan: planId }] });  
  return { customer, subscription };
}

export default {
  getIPprotectionProduct,
  createCustomerAndSubscription
}
