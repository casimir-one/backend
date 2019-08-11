
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const VerificationToken = new Schema({
  "email": { type: String, required: true, index: true, unique: true, trim: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "firstName": { type: String, required: true, trim: true },
  "lastName": { type: String, required: true, trim: true, },
  "pricingPlan": {
    type: String,
    enum: ["free", "standard-monthly", "premium-monthly", "unlimited" /* add more plans here */],
    required: true,
    default: "free",
    index: true
  },
  "token": { type: String, required: true, index: true, trim: true, },
  "expirationTime": { type: Date, default: new Date(Date.now() + 604800000 /* 1 week */), required: true, index: true },
  "creator": { type: String, trim: true, required: true },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('verification-tokens', VerificationToken);

module.exports = model;