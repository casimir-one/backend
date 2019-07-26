import PricingPlan from './../schemas/pricingPlan';
import moment from 'moment';

async function findPricingPlan(name) {
  const plan = await PricingPlan.findOne({ _id: name });
  return plan;
}

async function findAllPricingPlans() {
  const plans = await PricingPlan.find({});
  return plans;
}


export {
  findPricingPlan,
  findAllPricingPlans
}