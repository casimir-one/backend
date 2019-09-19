
import mongoose from 'mongoose';
import TemplateRef from './templateRef';

const Schema = mongoose.Schema;

const ContractRef = new Schema({
  "_id": { type: Number },
  "templateRef": TemplateRef.schema,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const model = mongoose.model('contracts-references', ContractRef);

module.exports = model;