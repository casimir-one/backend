
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Notification = new Schema({
    "username": { type: String, required: true, index: true },
    "status": {
        type: String,
        enum : ['unread', 'read'],
        required: true
    },
    "type": {
        type: String,
        enum : [
            'new-proposal', 
            'completed-proposal', 
            'invitation', 
            'approved-invitation', 
            'rejected-invitation',
            'review' 
        ],
        required: true
    },
    "meta": { type: Object },
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('notifications', Notification);

module.exports = model;