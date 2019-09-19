const mongoose = require('mongoose');

const { sharedFileStatusValues } = require('./../common/enums');

const Schema = mongoose.Schema;

const SharedFile = new Schema({
  "fileRefId": { type: Schema.Types.ObjectId, required: true },
  "filename": { type: String, required: true },
  "sender": { type: String, required: true },
  "receiver": { type: String, required: true },
  "contractId": { type: Number, required: false, default: null },
  "permissionRequestId": { type: Number, required: false, default: null },
  "status": {
    type: String,
    enum: sharedFileStatusValues,
    required: true,
  },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('shared-files', SharedFile);

module.exports = model;