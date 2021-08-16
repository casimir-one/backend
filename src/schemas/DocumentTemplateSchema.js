import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DocumentTemplateSchema = new Schema({
  "account": { type: String, required: true },
  "title": { type: String, required: false },
  "body": { type: Object, required: true },
  "creator": { type: String, required: true },
  "tenantId": { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: true } });

const model = mongoose.model('document-template', DocumentTemplateSchema);

module.exports = model;
