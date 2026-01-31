const mongoose = require('mongoose');

// This collection stores the ACTUAL VOTE counts.
// IT MUST NOT HAVE 'voterId' to ensure anonymity.
const voteSchema = new mongoose.Schema({
    electionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election',
        required: true,
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    constituency: {
        type: String,
        required: true,
    },
    encryptedVote: { // Optional: For advanced cryptographic verification
        type: String,
    }
}, { timestamps: true });

const Vote = mongoose.model('Vote', voteSchema);
module.exports = Vote;
