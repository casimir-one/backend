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

async function createCustomer({
  stripeToken, customerEmail
}) {
  const customerData = {
    source: stripeToken,
    email: customerEmail
  };
  if (config.environment === 'local') {
    customerData.description = 'Local development customer';
    customerData.metadata = { type: 'local' };
  }
  return stripe.customers.create(customerData);
}

async function updateCustomer(customerId, { email, sourceCardToken }) {
  const updateData = {}
  if (email) {
    updateData.email = email;
  }
  if (sourceCardToken) {
    updateData.source = sourceCardToken;
  }
  return stripe.customers.update(customerId, updateData);
}

async function createSubscription(customerId, {
  planId, trialPeriodDays, metadata
}) {
  const subscriptionData = {
    customer: customerId,
    metadata,
    items: [{ plan: planId }],
    expand: ['latest_invoice.payment_intent']
  };
  if (trialPeriodDays !== undefined && trialPeriodDays > 0) {
    subscriptionData.trial_period_days = trialPeriodDays;
  }
  return stripe.subscriptions.create(subscriptionData);
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

function constructEventFromWebhook({ body, sig, endpointSecret }) {
  return stripe.webhooks.constructEvent(body, sig, endpointSecret);
}

async function findCustomer(customerId) {
  let customer = await stripe.customers.retrieve(customerId, {
    expand: ['default_source']
  });
  return customer;
}

async function findPricingPlan(planId) {
  let plan = await stripe.plans.retrieve(planId);
  return plan;
}

async function findInvoice(invoiceId) {
  let invoice = await stripe.invoices.retrieve(invoiceId);
  return invoice;
}

async function findPaymentIntent(paymentIntentId) {
  let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

async function createPaymentIntent({
  amount, customerId, paymentMethod, metadata
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethod,
    metadata,
  });
  return paymentIntent;
};

export default {
  getIPprotectionProduct,
  createCustomer,
  createSubscription,
  findSubscription,
  updateSubscription,
  getSubscriptions,
  cancelSubscriptionAtEndOfCurrentBillingPeriod,
  reactivateSubscriptionBeforeEndOfCurrentBillingPeriod,
  constructEventFromWebhook,
  findCustomer,
  updateCustomer,
  findPricingPlan,
  findInvoice,
  findPaymentIntent,
  createPaymentIntent
}
