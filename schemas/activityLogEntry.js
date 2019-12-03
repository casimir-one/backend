
import mongoose from 'mongoose';
import ACTIVITY_LOG_TYPE from './../constants/activityLogType';

const Schema = mongoose.Schema;

const ActivityLogEntry = new Schema({
  "researchGroupId": { type: Number, required: true, index: true },
  "type": {
    type: String,
    enum: [
      ACTIVITY_LOG_TYPE.PROPOSAL,
      ACTIVITY_LOG_TYPE.PROPOSAL_ACCEPTED,
      ACTIVITY_LOG_TYPE.PROPOSAL_VOTE,
      ACTIVITY_LOG_TYPE.INVITATION_APPROVED,
      ACTIVITY_LOG_TYPE.INVITATION_REJECTED,
      ACTIVITY_LOG_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW,
      ACTIVITY_LOG_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW_REQUEST,
      ACTIVITY_LOG_TYPE.RESEARCH_CONTENT_ACCESS_REQUEST,
      ACTIVITY_LOG_TYPE.RESEARCH_CONTENT_ACCESS_REQUEST_APPROVED,
      ACTIVITY_LOG_TYPE.RESEARCH_CONTENT_ACCESS_REQUEST_REJECTED
    ],
    required: true
  },
  "metadata": { _id: false, type: Object, default: {}},
}, {
  "timestamps": {
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

const model = mongoose.model('research-group-activity-log-entries', ActivityLogEntry);

module.exports = model;