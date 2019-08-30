
import mongoose from 'mongoose';
import TemplateRef from './templateRef';

const Schema = mongoose.Schema;

const ContractRef = new Schema({
  "templateRef": TemplateRef.schema,
  "sender": {
    "email": { type: String, required: true, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
    "username": { type: String, required: true },
    "pubKey": { type: String, required: true }
  },
  "receiver": {
    "email": { type: String, required: true, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
    "username": { type: String, required: false, default: null },
    "pubKey": { type: String, required: false, default: null }
  },
  "hash": { type: String, required: false, default: null },
  "expirationDate": { type: Date, required: true },
  "status": {
    type: String,
    enum: [
      'pending-receiver-registration',
      'pending-sender-signature',
      'pending-receiver-signature', 
      'signed',
      'declined', 
      'expired'
    ],
    required: true
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const model = mongoose.model('contracts-references', ContractRef);

module.exports = model;