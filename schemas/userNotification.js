
import mongoose from 'mongoose';
import USER_NOTIFICATION_TYPE from './../constants/userNotificationType';

const Schema = mongoose.Schema;

const UserNotification = new Schema({
    "username": { type: String, required: true, index: true },
    "status": {
        type: String,
        enum : ['unread', 'read'],
        required: true
    },
    "type": {
        type: String,
        enum : [
            USER_NOTIFICATION_TYPE.PROPOSAL,
            USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED,
            USER_NOTIFICATION_TYPE.INVITATION,
            USER_NOTIFICATION_TYPE.INVITATION_APPROVED,
            USER_NOTIFICATION_TYPE.INVITATION_REJECTED,
            USER_NOTIFICATION_TYPE.EXCLUSION_APPROVED,          
            USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW,
            USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW_REQUEST,
            USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_ACCESS_REQUEST,
            USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_ACCESS_REQUEST_APPROVED,
            USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_ACCESS_REQUEST_REJECTED,
            USER_NOTIFICATION_TYPE.EXPERTISE_ALLOCATED
        ],
        required: true
    },
    "metadata": { _id: false, type: Object, default: {} },
}, {
    "timestamps": {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    } 
});

const model = mongoose.model('user-notifications', UserNotification);

module.exports = model;