
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ResearchContent = new Schema({
    "_id": { type: String },
    "filename": { type: String, required: true },
    "research": { type: String, required: true },
    "title": { type: String },
    "hash": {type: String, index: true },
    "type": {
        type: String,
        enum : ['file', 'dar'],
        required: true
    },
    "status": {
        type: String,
        enum : ['in-progress', 'proposed', 'completed'],
        required: true
    }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('research-content', ResearchContent);

module.exports = model;