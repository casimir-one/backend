
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Subscription = new Schema({
  "owner": { type: String, required: true, index: true, unique: true },
  "pricingPlan": {
    type: String,
    enum: ["standard", "white-label", "unlimited" /* add more plans here */],
    required: true,
    default: "standard",
    index: true
  },
  "limits": {
    type: {
      "certificateLimit": {
        type: {
          "counter": { type: Number, required: true, default: 0 },
          "resetTime": { type: Date, required: true },
          "lastExportTime": { type: Date }
        },
        required: false
      }
    },
    required: false
  },
  "expirationTime": { type: Date, required: false, index: true },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('subscriptions', Subscription);

module.exports = model;