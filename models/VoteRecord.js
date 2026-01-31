const mongoose = require('mongoose');

// This collection tracks WHO voted, but NOT who they voted for (linked to user, but not candidate)
const voteRecordSchema = new mongoose.Schema({
    voterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voter',
        required: true,
    },
    electionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election',
        required: true,
    },
}, { timestamps: true });

// Prevent duplicate voting
voteRecordSchema.index({ voterId: 1, electionId: 1 }, { unique: true });

const VoteRecord = mongoose.model('VoteRecord', voteRecordSchema);
module.exports = VoteRecord;
