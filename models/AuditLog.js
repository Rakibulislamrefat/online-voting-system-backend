const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true }, // e.g., 'ELECTION_CREATED', 'VOTE_CAST', 'VOTER_APPROVED'
    actorId: { type: mongoose.Schema.Types.ObjectId, required: true }, // AdminID or VoterID
    actorType: { type: String, enum: ['Admin', 'Voter', 'System'] },
    details: { type: Object }, // Flexible wrapper for extra data
    ipAddress: { type: String },
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
