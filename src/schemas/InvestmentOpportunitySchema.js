import mongoose from 'mongoose';
import AssetValueSchema from './AssetValueSchema';
import { INVESTMENT_OPPORTUNITY_TYPE } from './../constants';
import { TS_TYPES } from '@deip/constants';

const Schema = mongoose.Schema;

const InvestmentOpportunitySchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "title": { type: String },
  "metadata": { type: Object },
  "teamId": { type: String, required: true },
  "startTime": { type: Number, required: true },
  "endTime": { type: Number, required: true },
  "shares": { type: [AssetValueSchema], required: true },
  "softCap": { type: AssetValueSchema, required: true },
  "hardCap": { type: AssetValueSchema, required: true },
  "creator": { type: String, required: true },
  "totalInvested": { type: AssetValueSchema, required: true },
  "type": {
    type: Number,
    enum: [...Object.values(INVESTMENT_OPPORTUNITY_TYPE)],
    required: true,
    default: INVESTMENT_OPPORTUNITY_TYPE.PROJECT_TOKEN_SALE
  },
  "status": {
    type: Number,
    enum: [...Object.values(TS_TYPES)],
    required: true,
    default: TS_TYPES.INACTIVE
  },
}, { timestamps: true });

const model = mongoose.model('investment-opportunity', InvestmentOpportunitySchema);

module.exports = model;