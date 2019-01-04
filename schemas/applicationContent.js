
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ApplicationContent = new Schema({
    "_id": { type: String },
    "filename": { type: String, required: true },
    "agency": { type: String, required: true },
    "researchId": { type: Number, required: true },
    "researchGroupId": { type: Number, required: true },
    "foaId":  { type: Number, required: true },
    "title": { type: String },
    "hash": {type: String, index: true },
    "type": {
        type: String,
        enum : ['file'],
        required: true
    },
    "authors": [{ type: String }]
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('application-content', ApplicationContent);

module.exports = model;