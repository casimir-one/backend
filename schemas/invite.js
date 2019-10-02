const mongoose = require('mongoose');

const { inviteStatusValues } = require('./../common/enums');

const Schema = mongoose.Schema;

const Invite = new Schema({
  "sender": { type: String, required: true },
  "invitee": {
    type: {
      "email": { type: String, required: true },
      "id": { type: String, required: false, default: null },
    },
    required: true,
  },
  "code": { type: String, required: true, trim: true, },
  "status": {
    type: String,
    enum: inviteStatusValues,
    required: true,
  },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('invites', Invite);

module.exports = model;
