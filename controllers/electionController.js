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
const castVote = async (req, res) => {
    const { electionId, candidateId } = req.body;
    const voterId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Check if user already voted (Check VoteRecord)
        const existingVote = await VoteRecord.findOne({ voterId, electionId }).session(session);
        if (existingVote) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'You have already voted in this election' });
        }

        // 2. Find Election & Check Status
        const election = await Election.findById(electionId).session(session);
        if (!election || election.phase !== 'ongoing') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Election is not currently active' });
        }

        // 3. Create Anonymous Vote
        await Vote.create([{
            electionId,
            candidateId,
            constituency: req.user.constituency // Store constituency for regional analysis
        }], { session });

        // 4. Create Vote Record (Receipt)
        await VoteRecord.create([{
            voterId,
            electionId
        }], { session });

        // 5. Update Candidate Count (Optimistic update for UI, ground truth is aggregation of Vote collection)
        const candidate = election.candidates.id(candidateId);
        if (candidate) {
            candidate.count += 1;
            await election.save({ session });
        } else {
            throw new Error('Candidate not found');
        }

        await session.commitTransaction();
        session.endSession();

        // 6. Real-time broadcast (Outside transaction)
        const io = req.app.get('io');
        if (io) {
            io.emit('update_results', { electionId, candidates: election.candidates });
        }

        res.status(201).json({ message: 'Vote cast successfully' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ message: 'Voting failed due to system error' });
    }
};

module.exports = { createElection, getElections, getElectionById, castVote };
