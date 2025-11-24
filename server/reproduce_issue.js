const mongoose = require('mongoose');
const Voter = require('./models/Voter');
const Candidate = require('./models/Candidate');
const Election = require('./models/Election');
const dotenv = require('dotenv');

dotenv.config();

async function testDashboardData() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/voting-system';
        console.log('Connecting to MongoDB at:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Mask credentials

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 // Timeout after 5s
        });
        console.log('✅ MongoDB Connected');

        console.log('Testing Voter.countDocuments()...');
        const voterCount = await Voter.countDocuments();
        console.log('Voter count:', voterCount);

        console.log('Testing Candidate.countDocuments()...');
        const candidateCount = await Candidate.countDocuments();
        console.log('Candidate count:', candidateCount);

        console.log('Testing Voter.countDocuments({ voteStatus: true })...');
        const votersVoted = await Voter.countDocuments({ voteStatus: true });
        console.log('Voters voted:', votersVoted);

        console.log('✅ Dashboard data queries successful');
    } catch (error) {
        console.error('❌ Error occurred:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

testDashboardData();
