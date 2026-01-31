const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const voterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    nid: {
        type: String,
        required: true,
        unique: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    constituency: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Hash password before saving
voterSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
voterSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Voter = mongoose.model('Voter', voterSchema);
module.exports = Voter;
