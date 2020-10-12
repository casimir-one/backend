
import mongoose from 'mongoose';
import { EXPRESS_LICENSE_REQUEST_STATUS } from './../constants';

const Schema = mongoose.Schema;

const ExpressLicenseRequest = new Schema({
  "_id": { type: String, required: true },
  "requester": { type: String, required: true, index: true },
  "researchExternalId": { type: String, required: true, index: true },
  "researchGroupExternalId": { type: String, required: true, index: true },
  "licencePlan": { type: Object, required: true },
  "status": {
    type: String,
    enum: [...Object.values(EXPRESS_LICENSE_REQUEST_STATUS)],
    required: true
  },
  "expirationDate": { type: Date, required: true },
  "approvers": [{ type: String }],
  "rejectors": [{ type: String }]
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });


const model = mongoose.model('express-license-request', ExpressLicenseRequest);

module.exports = model;