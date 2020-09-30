
import mongoose from 'mongoose';
import ACTIVITY_LOG_TYPE from './../constants/activityLogType';

const Schema = mongoose.Schema;

const ActivityLogEntry = new Schema({
  "researchGroupId": { type: Number, required: true, index: true },
  "type": {
    type: String,
    enum: [...Object.values(ACTIVITY_LOG_TYPE)],
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