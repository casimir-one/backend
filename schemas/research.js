
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Research = new Schema({
  "researchGroupId": { type: Number, required: true },
  "permlink": { type: String, required: true },
  "milestones": [{
    "_id": false,
    "goal": { type: String, required: true },
    "budget": { type: String, defaul: null },
    "purpose": { type: String, defaul: null },
    "details": { type: String, default: null },
    "eta": { type: Date, required: true },
    "isActive": { type: Boolean, default: false },
  }],
  "videoSrc": { type: String, default: null },
  "partners": [{
    "_id": false,
    "type": { type: String, required: true },
    "title": { type: String, required: true }
  }],
  "trl": { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('research', Research);

module.exports = model;