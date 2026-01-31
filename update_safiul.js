const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Election = require('./models/Election');

dotenv.config();

const updateCandidate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bangladesh-voting-system');
        console.log('DB Connected');

        // Find elections containing a candidate named "Safiul" (case-insensitive)
        const elections = await Election.find({ "candidates.name": { $regex: /Safiul/i } });

        if (elections.length === 0) {
            console.log('No candidate named "Safiul" found.');
            process.exit();
        }

        for (const election of elections) {
            const candidate = election.candidates.find(c => c.name.match(/Safiul/i));
            if (candidate) {
                candidate.symbol = 'Rooster';
                candidate.symbolImage = '/rooster.png'; // Path relative to public folder
                await election.save();
                console.log(`Updated Safiul in election "${election.title}" with Rooster symbol.`);
            }
        }

        console.log('Update Complete');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateCandidate();
