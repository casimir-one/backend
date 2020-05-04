
// import mongoose from 'mongoose';

// const Schema = mongoose.Schema;

// const ResearchGroupInvite = new Schema({
//   "_id": { type: String },
//   "member": { type: String, required: true, index: true },
//   "researchGroupAccount": { type: String, required: true, index: true },
//   "notes": { type: String, required: true, trim: true },
//   "weight": { type: String },
//   "status": {
//     type: String,
//     enum: ['proposed', 'sent', 'approved', 'rejected', 'expired'],
//     required: true
//   },
//   "expiration": { type: Date, required: true, index: true },
// }, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

// const model = mongoose.model('research-group-invites', ResearchGroupInvite);

// module.exports = model;