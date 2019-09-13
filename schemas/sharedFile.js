import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const SharedFile = new Schema({
  "fileRefId": { type: Schema.Types.ObjectId, required: true },
  "filename": { type: String, required: true },
  "sender": { type: String, required: true },
  "receiver": { type: String, required: true },
  "contractId": { type: String, required: false, default: null },
  "permissionRequestId": { type: String, required: false, default: null },
  "status": {
    type: String,
    enum: ['locked', 'access_requested', 'unlocked'],
    required: true,
  },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('shared-files', SharedFile);

module.exports = model;