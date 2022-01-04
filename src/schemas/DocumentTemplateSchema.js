import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DocumentTemplateSchema = new Schema({
  "portalId": { type: String, required: true },
  "account": { type: String, required: true },
  "title": { type: String, required: false },
  "body": { type: Object, required: true },
  "creator": { type: String, required: true }
}, { timestamps: true });

const model = mongoose.model('document-template', DocumentTemplateSchema);

module.exports = model;
