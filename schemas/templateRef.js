
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const TemplateRef = new Schema({
  "title": { type: String, required: true },
  "organizationId": { type: Number, required: true },
  "originalname": { type: String, required: true },
  "filename": { type: String, required: true },
  "filetype": { type: String, required: true },
  "filepath": { type: String, required: true },
  "size": { type: Number, required: true },
  "uploader": { type: String, required: true }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('templates-references', TemplateRef);

module.exports = model;