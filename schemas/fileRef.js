
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const FileRef = new Schema({
  "projectId": { type: Number, required: true },
  "organizationId": { type: Number, required: true },
  "filename": { type: String, required: true },
  "filetype": { type: String, required: true },
  "filepath": { type: String, required: true },
  "size": { type: Number, required: true },
  "hash": { type: String, index: true, required: true },
  "iv": { type: String, required: true },
  "permlink": { type: String },
  "chunkSize": { type: Number, required: true },
  "status": {
    type: String,
    enum: ['timestamped', 'uploaded', 'uploaded_and_timestamped'],
    required: true
  },
  "accessKeys": [{
    "name": { type: String, required: true },
    "pubKey": { type: String, required: true },
    "key": { type: String, required: true },
  }],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('files-references', FileRef);

module.exports = model;