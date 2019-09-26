
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PricingPlan = new Schema({
  "_id": { type: String },
  "name": { type: String, required: true, trim: true },
  "stripeId": { type: String, required: false, index: true, default: null },
  "terms": {
    type: {
      "certificateLimit": {
        type: {
          "limit": { type: Number, required: true },
          "period": {
            type: String,
            enum: ["month", "year"],
            required: true,
            default: "month"
          }
        },
        required: false
      },
      "contractLimit": {
        type: {
          "limit": { type: Number, required: true },
          "period": {
            type: String,
            enum: ["month", "year"],
            required: true,
            default: "month"
          }
        },
        required: false
      },
      "fileShareLimit": {
        type: {
          "limit": { type: Number, required: true },
          "period": {
            type: String,
            enum: ["month", "year"],
            required: true,
            default: "month"
          }
        },
        required: false
      }
    },
    required: false
  },
  "trialTerms": {
    type: {
      "periodDays": { type: Number, required: true },
      "certificateLimit": { type: Number },
      "contractLimit": { type: Number },
      "fileShareLimit": { type: Number },
    },
    required: false
  },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('pricing-plans', PricingPlan);

module.exports = model;