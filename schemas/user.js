
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const UserProfile = new Schema({
    "_id": { type: String },
    "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
    "avatar": { type: String, default: "default-avatar.png" },
    "roles": [{
        "role": {
            type: String,
            enum: ['grant-program-officer', 'grant-finance-officer', 'university-certifier', 'treasury-certifier'],
            required: true
        },
        "researchGroupId": { type: Number, required: true },
        "metadata": { type: Object, default: null }
    }],
    "firstName": { type: String, default: null, trim: true },
    "lastName": { type: String, default: null, trim: true },
    "bio": { type: String, default: null, trim: true },
    "birthday": { type: Date, default: null },
    "location": {
        city: { type: String, trim: true, default: null },
        country: { type: String, trim: true, default: null }
    },
    "socialNetworks": [{
        "kind": {
            type: String,
            enum : ['Unknown', 'Facebook', 'LinkedIn', 'Twitter', 'VK', 'WeChat' ],
            required: true
        },
        "link": { type: String, required: true, trim: true },
        "metadata": { type: Object, default: null }
    }],
    "contacts": [{
        ext: { type: String, default: null, trim: true },
        number: { type: String, required: true, trim: true }
    }],
    "education": [{
        "educationalInstitution": { type: String, required: true, trim: true },
        "period": {
            from: { type: Date, default: null },
            to: { type: Date, default: null }
        },
        "degree": { type: String, required: true },
        "area": { type: String, required: true },
        "description": { type: String, default: null },
        "isActive": {type: Boolean, required: true, default: false}
    }],
    "employment":[{
        "company": { type: String, required: true, trim: true },
        "location": {
            city: { type: String, trim: true, default: null },
            country: { type: String, trim: true, default: null }
        }, 
        "period": {
            from: { type: Date, default: null },
            to: { type: Date, default: null }
        },
        "position": { type: String, required: true },
        "description": { type: String, default: null },
        "isActive": { type: Boolean, required: true, default: false }
    }],
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('user-profile', UserProfile);

module.exports = model;