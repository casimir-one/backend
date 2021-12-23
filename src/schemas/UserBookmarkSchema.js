import mongoose from 'mongoose';
import { USER_BOOKMARK_TYPE } from '@deip/constants';

const Schema = mongoose.Schema;

const UserBookmarkSchema = new Schema({
  "portalId": { type: String, required: true },
  "username": { type: String, required: true },
  "type": {
    type: Number,
    enum: [...Object.values(USER_BOOKMARK_TYPE)],
    required: true,
  },
  "ref": { type: String, required: true }
}, { timestamps: true });

UserBookmarkSchema.index({ username: 1, type: 1, ref: 1 }, { unique: true });

const model = mongoose.model('user-bookmark', UserBookmarkSchema);

module.exports = model;