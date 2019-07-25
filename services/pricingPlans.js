import PricingPlan from './../schemas/pricingPlan';
import moment from 'moment';

async function findPricingPlan(name) {
  const plan = await PricingPlan.findOne({ _id: name });
  return plan;
}

export {
  findPricingPlan
}