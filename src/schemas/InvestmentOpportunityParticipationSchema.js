import mongoose from 'mongoose';
import AssetValueSchema from './AssetValueSchema';

const Schema = mongoose.Schema;

const InvestmentOpportunityParticipationSchema = new Schema({
  "tenantId": { type: String, required: true },
  "investmentOpportunityId": { type: String, required: true },
  "investor": { type: String, required: true },
  "asset": { type: AssetValueSchema, required: true },
  "timestamp": { type: Number, required: true },
  "projectId": { type: String }
});

const model = mongoose.model('investment-opportunity-participation', InvestmentOpportunityParticipationSchema);

module.exports = model;