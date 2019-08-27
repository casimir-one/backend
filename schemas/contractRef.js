
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ContractRef = new Schema({
  "templateRef": { type: mongoose.Schema.Types.ObjectId, required: true },
  "sender": {
    "email": { type: String, required: true, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
    "username": { type: String, required: true },
    "pubKey": { type: String, required: true },
  },
  "receiver": {
    "email": { type: String, required: true, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
    "username": { type: String, required: false, default: null },
    "pubKey": { type: String, required: false, default: null },
  },
  "hash": { type: String, required: false, default: null },
  "files": [{
    "_id": { type: mongoose.Schema.Types.ObjectId, required: true }
  }],
  "expirationDate": { type: Date, required: true },
  "status": {
    type: String,
    enum: [
      'pending-sender-signature', // this status is being used for 2 cases - when a receiver is not registered yet or right after the receiver has registered but the contract is not signed by the sender yet 
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