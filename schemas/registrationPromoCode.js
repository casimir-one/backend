const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const RegistrationPromoCode = new Schema({
  "stripeId": { type: String, required: true },
  "code": { type: String, required: true, unique: true },
  "active": {
    type: Boolean,
    required: true,
    default: true
  },
  validPricingPlans: {
    type: [{
      type: String,
      enum: ['basic-monthly', 'standard-monthly'],
    }],
    required: true,
    default: undefined
  }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('registration-promo-codes', RegistrationPromoCode);

module.exports = model;
