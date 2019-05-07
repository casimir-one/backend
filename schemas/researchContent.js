
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ResearchContent = new Schema({
    "_id": { type: String },
    "filename": { type: String, required: true },
    "researchId": { type: Number, required: true },
    "researchGroupId": { type: Number, required: true },
    "title": { type: String },
    "hash": {type: String, index: true },
    "type": {
        type: String,
        enum : ['file', 'dar', 'package'],
        required: true
    },
    "status": {
        type: String,
        enum : ['in-progress', 'proposed', 'finished'],
        required: true
    },
    "packageFiles": [{
        "filename": { type: String, required: true },
        "hash": { type: String, required: true },
        "ext": { type: String, required: true },
    }],
    "authors": [{ type: String }],
    "references": [{ type: Number }],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('research-content', ResearchContent);

module.exports = model;