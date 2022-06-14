import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const VerificationTokenSchema = new Schema({
  "portalId": { type: String, required: true },
  "token": { type: String, required: true },
  "refId": { type: String, required: true },
  "metadata": { type: Object },
  "expirationTime": { type: Date, required: true }
}, { timestamps: true });

VerificationTokenSchema.index({ token: 1 }, { unique: true });
VerificationTokenSchema.index({ expirationTime: 1 },{ expireAfterSeconds: 0 });

const model = mongoose.model('verification-token', VerificationTokenSchema);

module.exports = model;