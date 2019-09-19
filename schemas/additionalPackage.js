const mongoose = require('mongoose');

const { additionalPackageTypeValues } = require('./../common/enums');

const Schema = mongoose.Schema;

const AdditionalPackage = new Schema({
  "_id": { type: String, required: true },
  "type": {
    type: String,
    enum: additionalPackageTypeValues,
    required: true,
  },
  "active": { type: Boolean, default: false },
  "price": { type: Number, required: true }, // in usd cents
  "numberOfUnits": { type: Number, required: true },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('additional-packages', AdditionalPackage);

module.exports = model;