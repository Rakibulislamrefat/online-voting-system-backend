const Admin = require('../models/Admin');
const Voter = require('../models/Voter');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Admin Login
// @route   POST /api/admin/login
const authAdmin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (admin && (await admin.matchPassword(password))) {
            // Log login
            await AuditLog.create({
                action: 'ADMIN_LOGIN',
                actorId: admin._id,
                actorType: 'Admin',
                ipAddress: req.ip
            });

            res.json({
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: 'admin',
                token: generateToken(admin._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register Admin (Seeding/Internal use)
// @route   POST /api/admin/register
const registerAdmin = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const adminExists = await Admin.findOne({ email });
        if (adminExists) return res.status(400).json({ message: 'Admin exists' });

        const admin = await Admin.create({ name, email, password });
        res.status(201).json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get pending voters
// @route   GET /api/admin/voters/pending
const getPendingVoters = async (req, res) => {
    try {
        const voters = await Voter.find({ isVerified: false }).select('-password');
        res.json(voters);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Approve a voter
// @route   PUT /api/admin/voters/:id/approve
const approveVoter = async (req, res) => {
    try {
        const voter = await Voter.findById(req.params.id);
        if (voter) {
            voter.isVerified = true;
            await voter.save();

            await AuditLog.create({
                action: 'VOTER_APPROVED',
                actorId: req.user._id, // Assumes auth middleware sets req.user
                actorType: 'Admin',
                details: { targetVoterId: voter._id, targetNid: voter.nid }
            });

            res.json({ message: 'Voter approved' });
        } else {
            res.status(404).json({ message: 'Voter not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all voters
// @route   GET /api/admin/voters
const getAllVoters = async (req, res) => {
    try {
        const voters = await Voter.find({}).select('-password');
        res.json(voters);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { authAdmin, registerAdmin, getPendingVoters, getAllVoters, approveVoter };
