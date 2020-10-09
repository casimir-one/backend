
import mongoose from 'mongoose';
import { EXPRESS_LICENSING_REQUEST_STATUS } from './../constants';

const Schema = mongoose.Schema;

const ExpressLicensingRequest = new Schema({
  "_id": { type: String, required: true },
  "requester": { type: String, required: true, index: true },
  "researchExternalId": { type: String, required: true, index: true },
  "researchGroupExternalId": { type: String, required: true, index: true },
  "licencePlan": { type: Object, required: true },
  "status": {
    type: String,
    enum: [...Object.values(EXPRESS_LICENSING_REQUEST_STATUS)],
    required: true
  },
  "expirationDate": { type: Date, required: true },
  "approvers": [{ type: String }],
  "rejectors": [{ type: String }]
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });


const model = mongoose.model('express-licensing-request', ExpressLicensingRequest);

module.exports = model;