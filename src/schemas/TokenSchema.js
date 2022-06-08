import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const TokenSchema = new Schema({
  "portalId": { type: String, required: true },
  "token": { type: String, required: true },
  "refId": { type: String, required: true },
  "metadata": { type: Object },
  "expirationTime": { type: Date, required: true }
}, { timestamps: true });

TokenSchema.index({ token: 1 }, { unique: true });
TokenSchema.index({ expirationTime: 1 },{ expireAfterSeconds: 0 });

const model = mongoose.model('token', TokenSchema);

module.exports = model;