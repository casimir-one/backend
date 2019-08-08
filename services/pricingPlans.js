import PricingPlan from './../schemas/pricingPlan';
import stripeService from './../services/stripe';
import moment from 'moment';

async function findPricingPlan(id) {
  let doc = await PricingPlan.findOne({ _id: id });
  let appPlan = doc._doc;
  if (appPlan.stripeId != null) {
    let { product, plans: stripePlans } = await stripeService.getIPprotectionProduct();
    let stripePlan = stripePlans.find(stripePlan => stripePlan.id == appPlan.stripeId);
    return { ...appPlan, stripePlan, stripeProduct: product };
  }
  return { ...appPlan };
}

async function findRegularPricingPlans() {
  let docs = await PricingPlan.find({});
  let appPlans = docs.map(d => d._doc);

  let { product, plans: stripePlans } = await stripeService.getIPprotectionProduct();
  let regularStripePlans = stripePlans.filter(p => p.metadata.type == "regular");

  let regularPlans = [];
  for (let i = 0; i < regularStripePlans.length; i++) {
    let stripePlan = regularStripePlans[i];
    let appPlan = appPlans.find(appPlan => appPlan.stripeId == stripePlan.id);
    regularPlans.push({ ...appPlan, stripePlan, stripeProduct: product });
  }

  return regularPlans;
}


export default {
  findPricingPlan,
  findRegularPricingPlans
}