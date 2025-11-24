const mongoose = require('mongoose');
const Candidate = require('./server/models/Candidate');

const MONGO_URI = 'mongodb://localhost:27017/voting-app';

async function addTestCandidates() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if candidates already exist
        const existingCount = await Candidate.countDocuments();
        console.log(`Existing candidates: ${existingCount}`);

        if (existingCount === 0) {
            const testCandidates = [
                {
                    firstName: 'John',
                    age: 45,
                    party: 'Democratic Party',
                    bio: 'Experienced politician with focus on education',
                    image: 'john.jpg',
                    symbol: 'tree'
                },
                {
                    firstName: 'Jane',
                    age: 38,
                    party: 'Republican Party',
                    bio: 'Business leader focused on economic growth',
                    image: 'jane.jpg',
                    symbol: 'star'
                },
                {
                    firstName: 'Alice',
                    age: 42,
                    party: 'Green Party',
                    bio: 'Environmental activist and community organizer',
                    image: 'alice.jpg',
                    symbol: 'leaf'
                },
                {
                    firstName: 'Bob',
                    age: 50,
                    party: 'Independent',
                    bio: 'Former mayor with strong local support',
                    image: 'bob.jpg',
                    symbol: 'flag'
                }
            ];

            await Candidate.insertMany(testCandidates);
            console.log('✅ Added test candidates successfully');
        } else {
            console.log('Candidates already exist, skipping insertion');
        }

        const allCandidates = await Candidate.find();
        console.log('\nAll candidates in database:');
        allCandidates.forEach(c => {
            console.log(`- ${c.firstName} (${c.party})`);
        });

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addTestCandidates();
