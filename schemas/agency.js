
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AgencyProfile = new Schema({
    "_id": { type: String },
    "name": { type: String },
    "shortName": { type: String },
    "description": { type: String },
    "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
    "logo": { type: String, default: "default_agency_logo.png" },
    "researchAreas": [{
        "title": { type: String, required: true },
        "disciplines": [{ type: Number }],
        "subAreas": [{
            "title": { type: String, required: true },
            "disciplines": [{ type: Number }]
        }]
    }],
    "researchGroupId": { type: Number, default: undefined },
    "observingResearchGroupsIds": [{ type: Number }],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('agencies', AgencyProfile);

module.exports = model;