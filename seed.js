const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminExists = await Admin.findOne({ email: 'admin@voting.com' });
        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        const admin = await Admin.create({
            name: 'Super Admin',
            email: 'admin@voting.com',
            password: 'password123',
        });

        console.log('Admin created successfully');
        console.log('Email: admin@voting.com');
        console.log('Password: password123');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();
