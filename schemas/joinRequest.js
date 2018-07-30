
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const JoinRequest = new Schema({
    "username": { type: String, required: true, index: true },
    "groupId": { type: Number, required: true, index: true },
    "coverLetter": { type: String, required: true, trim: true },
    "status": {
        type: String,
        enum : ['Pending', 'Approved' ,'Denied', 'Expired'],
        required: true
    },
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('join-requests', JoinRequest);

module.exports = model;