const Voter = require('../models/Voter');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id, role: 'voter' }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new voter
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { name, email, password, nid, dob, constituency } = req.body;

    try {
        const userExists = await Voter.findOne({ email });
        const nidExists = await Voter.findOne({ nid });

        if (userExists || nidExists) {
            return res.status(400).json({ message: 'User or NID already exists' });
        }

        const voter = await Voter.create({
            name,
            email,
            password,
            nid,
            dob,
            constituency
        });

        if (voter) {
            res.status(201).json({
                _id: voter._id,
                name: voter.name,
                email: voter.email,
                isVerified: voter.isVerified,
                // No token sent here, they must wait for approval
                message: 'Registration successful. Please wait for Admin approval.'
            });
        } else {
            res.status(400).json({ message: 'Invalid voter data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Auth voter & get token
// @route   POST /api/auth/login
const authUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const voter = await Voter.findOne({ email });

        if (voter && (await voter.matchPassword(password))) {
            if (!voter.isVerified) {
                return res.status(403).json({ message: 'Account not verified by Admin yet.' });
            }

            res.json({
                _id: voter._id,
                name: voter.name,
                email: voter.email,
                role: 'voter',
                constituency: voter.constituency,
                token: generateToken(voter._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, authUser };
