const mongoose = require('mongoose');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const VoteRecord = require('../models/VoteRecord');
const AuditLog = require('../models/AuditLog');

// @desc    Create a new election
// @route   POST /api/elections
// @access  Private/Admin
const createElection = async (req, res) => {
    const { title, description, candidates, constituencies, startTime, endTime } = req.body;

    try {
        const election = new Election({
            title,
            description,
            candidates,
            constituencies,
            startTime,
            endTime,
            phase: 'scheduled'
        });

        const createdElection = await election.save();

        await AuditLog.create({
            action: 'ELECTION_CREATED',
            actorId: req.user._id,
            actorType: 'Admin',
            details: { electionId: createdElection._id }
        });

        res.status(201).json(createdElection);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all elections
// @route   GET /api/elections
// @access  Public (should probably filter by status for public, but admin sees all)
const getElections = async (req, res) => {
    try {
        const elections = await Election.find({});
        res.json(elections);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get election by ID
// @route   GET /api/elections/:id
// @access  Public
const getElectionById = async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);
        if (election) res.json(election);
        else res.status(404).json({ message: 'Election not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Cast a vote (Anonymous & Secure)
// @route   POST /api/elections/vote
// @access  Private (Voter)
// @desc    Cast a vote (Anonymous & Secure)
// @route   POST /api/elections/vote
// @access  Private (Voter)
const castVote = async (req, res) => {
    const { electionId, candidateId } = req.body;
    const voterId = req.user._id;

    try {
        // 1. Check if user already voted (Check VoteRecord)
        const existingVote = await VoteRecord.findOne({ voterId, electionId });
        if (existingVote) {
            return res.status(400).json({ message: 'You have already voted in this election' });
        }

        // 2. Find Election & Check Status
        const election = await Election.findById(electionId);
        if (!election || election.phase !== 'ongoing') {
            return res.status(400).json({ message: 'Election is not currently active' });
        }

        // 3. Create Anonymous Vote
        await Vote.create({
            electionId,
            candidateId,
            constituency: req.user.constituency // Store constituency for regional analysis
        });

        // 4. Create Vote Record (Receipt)
        await VoteRecord.create({
            voterId,
            electionId
        });

        // 5. Update Candidate Count (Optimistic update for UI, ground truth is aggregation of Vote collection)
        const candidate = election.candidates.id(candidateId);
        if (candidate) {
            candidate.count += 1;
            await election.save();
        } else {
            throw new Error('Candidate not found');
        }

        // 6. Real-time broadcast
        const io = req.app.get('io');
        if (io) {
            io.emit('update_results', { electionId, candidates: election.candidates });
        }

        res.status(201).json({ message: 'Vote cast successfully' });

    } catch (error) {
        console.error("Voting Error:", error);
        res.status(500).json({ message: error.message || 'Voting failed due to system error' });
    }
};

// @desc    Update election status (Start/End)
// @route   PUT /api/elections/:id/status
// @access  Private/Admin
const updateElectionStatus = async (req, res) => {
    const { phase } = req.body; // 'ongoing', 'ended'
    try {
        const election = await Election.findById(req.params.id);
        if (election) {
            election.phase = phase;
            await election.save();

            await AuditLog.create({
                action: 'ELECTION_STATUS_UPDATE',
                actorId: req.user._id,
                actorType: 'Admin',
                details: { electionId: election._id, newPhase: phase }
            });

            res.json(election);
        } else {
            res.status(404).json({ message: 'Election not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update election details
// @route   PUT /api/elections/:id
// @access  Private/Admin
const updateElection = async (req, res) => {
    const { title, description, constituencies, startTime, endTime } = req.body;

    try {
        const election = await Election.findById(req.params.id);

        if (election) {
            // Note: Preventing candidate updates for simplicity to avoid vote integrity issues
            // In a real app, complex logic is needed to handle candidate changes after votes are cast.
            election.title = title || election.title;
            election.description = description || election.description;
            election.constituencies = constituencies || election.constituencies;
            election.startTime = startTime || election.startTime;
            election.endTime = endTime || election.endTime;

            const updatedElection = await election.save();

            await AuditLog.create({
                action: 'ELECTION_UPDATED',
                actorId: req.user._id,
                actorType: 'Admin',
                details: { electionId: election._id }
            });

            res.json(updatedElection);
        } else {
            res.status(404).json({ message: 'Election not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createElection, getElections, getElectionById, castVote, updateElectionStatus, updateElection };
