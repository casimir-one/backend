import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const UserBookmark = new Schema({
    "tenantId": { type: String, required: true },
    "username": { type: String, required: true },
    "type": {
      type: String,
      enum: ['research'],
      required: true,
    },
    "ref": { type: String, required: true },
    "created": { type: Date, default: Date.now },
    "updated": { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

UserBookmark.index({ username: 1, type: 1, ref: 1 }, { unique: true });

const model = mongoose.model('user-bookmark', UserBookmark);

module.exports = model;