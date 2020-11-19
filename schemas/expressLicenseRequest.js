
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ExpressLicenseRequest = new Schema({
  "_id": { type: String, required: true },
  "requester": { type: String, required: true, index: true },
  "researchExternalId": { type: String, required: true, index: true },
  "licenseExternalId": { type: String, required: true, index: true },
  "licencePlan": { type: Object, required: true },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });


export default ExpressLicenseRequest;