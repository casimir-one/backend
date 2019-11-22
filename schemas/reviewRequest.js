
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ReviewRequest = new Schema({
    "expert": { type: String, required: true, index: true },
    "contentId": { type: Number, required: true },
    "requestor": { type: String, required: true },
    "status": {
        type: String,
        enum : ['pending', 'approved', 'denied'],
        required: true
    },
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('review-requests', ReviewRequest);

module.exports = model;