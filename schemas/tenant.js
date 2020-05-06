
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ResearchArea = new Schema({
  "title": { type: String, required: true },
  "disciplines": [{ type: String }],
  "subAreas": [{
    "title": { type: String, required: true },
    "disciplines": [{ type: Number }]
  }]
});

const FAQ = new Schema({
  "question": { type: String, required: true },
  "answer": { type: String, required: true },
  "isVisible": { type: Boolean, required: true },
});

const ResearchComponent = new Schema({
  "type": { type: String, enum: ['stepper'], required: true },
  "values": { type: Object, required: true },
});

const TenantProfile = new Schema({
    "_id": { type: String },
    "name": { type: String },
    "shortName": { type: String },
    "description": { type: String },
    "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
    "logo": { type: String, default: "default_tenant_logo.png" },
    "banner": { type: String, default: "default_banner_logo.png" },
    "admins": [{
      "name": { type: String, required: true, trim: true },
      "metadata": { type: Object, default: null }
    }],
    "settings": {
      "researchAreas": [ResearchArea],
      "ResearchComponents": [ResearchComponent],
      "faq": [FAQ],
      "researchesBlacklist": [{ type: String, required: true, trim: true }],
      "researchesWhitelist": [{ type: String, required: true, trim: true }]
    }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });



const model = mongoose.model('tenants', TenantProfile);

module.exports = model;