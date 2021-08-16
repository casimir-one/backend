import mongoose from 'mongoose';
import { INVESTMENT_OPPORTUNITY_TYPE } from './../constants';

const Schema = mongoose.Schema;

const InvestmentOpportunitySchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "title": { type: String },
  "metadata": { type: Object },
  "type": {
    type: String,
    enum: [...Object.values(INVESTMENT_OPPORTUNITY_TYPE)],
    required: true,
    default: INVESTMENT_OPPORTUNITY_TYPE.PROJECT_TOKEN_SALE
  },
});

const model = mongoose.model('investment-opportunity', InvestmentOpportunitySchema);

module.exports = model;