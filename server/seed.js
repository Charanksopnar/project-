const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const Voter = require('./models/Voter');
const Candidate = require('./models/Candidate');
const Election = require('./models/Election');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample data
const sampleData = {
  admin: {
    username: 'admin',
    password: 'admin@123'
  },
  voter: {
    name: 'Test User',
    username: 'testuser',
    email: 'user@gmail.com',
    password: '123',
    dob: new Date('1990-01-01'),
    age: 33,
    address: '123 Test Street, Test City',
    phone: '1234567890',
    idProof: 'default-id.jpg',
    profilePic: 'default-profile.jpg',
    voteStatus: false
  },
  candidates: [
    {
      firstName: 'John Doe',
      age: 45,
      party: 'Democratic Party',
      bio: 'Experienced leader with a focus on education and healthcare.',
      image: 'default-candidate.jpg',
      symbol: 'default-symbol.jpg',
      votes: 0
    },
    {
      firstName: 'Jane Smith',
      age: 50,
      party: 'Republican Party',
      bio: 'Business leader with a strong economic policy.',
      image: 'default-candidate.jpg',
      symbol: 'default-symbol.jpg',
      votes: 0
    },
    {
      firstName: 'Alex Johnson',
      age: 38,
      party: 'Independent',
      bio: 'Community organizer focused on social justice.',
      image: 'default-candidate.jpg',
      symbol: 'default-symbol.jpg',
      votes: 0
    }
  ],
  election: {
    title: 'Presidential Election 2024',
    description: 'National election for the next president.',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    status: 'upcoming'
  }
};

// Seed database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await Admin.deleteMany({});
    await Voter.deleteMany({});
    await Candidate.deleteMany({});
    await Election.deleteMany({});
    
    console.log('Database cleared');
    
    // Create admin
    const admin = new Admin(sampleData.admin);
    await admin.save();
    console.log('Admin created');
    
    // Create voter
    const voter = new Voter(sampleData.voter);
    await voter.save();
    console.log('Voter created');
    
    // Create candidates
    const candidates = await Candidate.insertMany(sampleData.candidates);
    console.log('Candidates created');
    
    // Create election with candidates
    const election = new Election({
      ...sampleData.election,
      candidates: candidates.map(candidate => candidate._id)
    });
    await election.save();
    console.log('Election created');
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
