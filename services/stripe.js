import config from './../config';
const stripe = require('stripe')(config.stripe.secretKey);

async function ipProtectionProduct() {

  let product = await stripe.products.retrieve(config.stripe.ipProtectionProductId);
  let allPlans = await stripe.plans.list({});

  let productPlans = allPlans.data.filter(plan => {
    return plan.product === product.id;
  });

  return { product, plans: productPlans };
}

export default {
  ipProtectionProduct
}
