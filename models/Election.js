const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    symbol: { type: String }, // Name of symbol
    symbolImage: { type: String }, // URL to symbol image
    count: { type: Number, default: 0 }
});

const electionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    candidates: [candidateSchema],
    constituencies: [{ type: String }], // e.g. ["Dhaka-10", "Chittagong-5"] or empty for National
    phase: {
        type: String,
        enum: ['proclamation', 'scheduled', 'ongoing', 'ended', 'result_published'],
        default: 'proclamation',
    },
    startTime: {
        type: Date,
    },
    endTime: {
        type: Date,
    }
}, { timestamps: true });

// Indexing for faster lookups
electionSchema.index({ phase: 1 });

const Election = mongoose.model('Election', electionSchema);
module.exports = Election;
