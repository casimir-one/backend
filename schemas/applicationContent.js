
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ApplicationContent = new Schema({
    "filename": { type: String, required: true },
    "agency": { type: String, required: true },
    "researchId": { type: Number, required: true },
    "researchGroupId": { type: Number, required: true },
    "foaId":  { type: Number, required: true },
    "title": { type: String },
    "hash": { type: String, required: true, index: true },
    "type": {
        type: String,
        enum : ['file', 'package'],
        required: true
    },
    "status": {
        type: String,
        enum : ['pending', 'approved', 'rejected'],
        required: true
    },
    "packageForms": [{
        "filename": { type: String, required: true },
        "hash": { type: String, required: true }
    }],
    "letterHash": {type: String, required: true, index: true },
    "authors": [{ type: String }]
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('application-content', ApplicationContent);

module.exports = model;