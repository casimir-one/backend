
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ExpertiseClaim = new Schema({
    "tenantId": { type: String, required: true },
    "username": { type: String, required: true, index: true },
    "disciplineId": { type: Number, required: true, index: true },
    "coverLetter": { type: String, required: true, trim: true },
    "status": {
        type: String,
        enum : ['pending', 'approved'],
        required: true
    },
    "publications": [],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

ExpertiseClaim.index({ username: 1, disciplineId: 1 }, { unique: true })

const model = mongoose.model('expertise-claims', ExpertiseClaim);

module.exports = model;