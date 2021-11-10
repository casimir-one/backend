import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AssetValueSchema = new Schema({
  "_id": false,
  "id": { type: String, required: true },
  "symbol": { type: String, required: true },
  "amount": { type: String, required: true },
  "precision": { type: Number, required: true }
});

module.exports = AssetValueSchema;