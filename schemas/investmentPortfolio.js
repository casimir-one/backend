
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const InvestmentPortfolio = new Schema({
    "_id": { type: String },
    "title": { type: String, default: "" },
    "description": { type: String, default: "" },
    "members": [{
        _id: false,
        "role": {
            type: String,
            enum: ['advisor', 'owner'],
            required: true
        },
        "username": { type: String, required: true }
    }],
    "researches": [{
        _id: false,
        "id": { type: String, required: true },
        "tags": [{
            _id: false,
            "name": { type: String, required: true },
            "list": { type: String, required: true }
        }],
        "memo": { type: String, required: false },
        "comments": [{
            _id: false,
            "id": { type: String, required: true },
            "username": { type: String, required: true },
            "text": { type: String, required: true },
            "timestamp": { type: Date, default: Date.now },
        }],
        "metadata": { type: Object, default: null }
    }],
    "lists": [{
        _id: false,
        "id": { type: String, required: true },
        "name": { type: String, required: true },
        "color": { type: String, required: true }
    }],
    "metadata": { _id: false, type: Object, default: null } // saved searches
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('investment-portfolio', InvestmentPortfolio);

module.exports = model;