
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ResearchContent = new Schema({
    "_id": { type: String },
    "filename": { type: String, required: true },
    "research": { type: String, required: true }
});

const model = mongoose.model('research-content', ResearchContent);

module.exports = model;