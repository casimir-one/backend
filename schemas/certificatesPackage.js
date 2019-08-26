import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const CertificatesPackages = new Schema({
  "_id": { type: String },
  "price": { type: Number, required: true },
  "numberOfCertificates": { type: Number, required: true },
  
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('certificates-packages', CertificatesPackages);

module.exports = model;