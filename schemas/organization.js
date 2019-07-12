
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const OrganizationProfile = new Schema({
    "permlink": { type: String, required: true },
    "name": { type: String, required: true },
    "website": { type: String },
    "fullName": { type: String },
    "description": { type: String },
    "country": { type: String },
    "city": { type: String },
    "addressLine1": { type: String },
    "addressLine2": { type: String },
    "zip": { type: String },
    "phoneNumber": { type: String },
    "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is malformed'] },
    "logo": { type: String, default: "default_organization_logo.png" },
    "members": [{
        "name": { type: String, required: true }
    }],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('organizations', OrganizationProfile);

module.exports = model;