const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mock data
const mockData = {
  voters: [
    {
      _id: '1',
      name: 'Test User',
      username: 'testuser',
      email: 'user@gmail.com',
      age: 30,
      voteStatus: false,
      profilePic: 'default-profile.jpg'
    }
  ],
  candidates: [
    {
      _id: '1',
      firstName: 'John Doe',
      age: 45,
      party: 'Democratic Party',
      bio: 'Experienced leader with a focus on education and healthcare.',
      image: 'default-candidate.jpg',
      symbol: 'default-symbol.jpg',
      votes: 10
    },
    {
      _id: '2',
      firstName: 'Jane Smith',
      age: 50,
      party: 'Republican Party',
      bio: 'Business leader with a strong economic policy.',
      image: 'default-candidate.jpg',
      symbol: 'default-symbol.jpg',
      votes: 8
    },
    {
      _id: '3',
      firstName: 'Alex Johnson',
      age: 38,
      party: 'Independent',
      bio: 'Community organizer focused on social justice.',
      image: 'default-candidate.jpg',
      symbol: 'default-symbol.jpg',
      votes: 5
    }
  ],
  dashboardData: {
    voterCount: 100,
    candidateCount: 3,
    votersVoted: 23
  }
};

// Mock routes

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'user@gmail.com' && password === '123') {
    res.status(200).json({
      success: true,
      token: 'mock-token',
      voterObject: mockData.voters[0]
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Admin login route
app.post('/adminlogin', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin@123') {
    res.status(200).json({
      success: true,
      token: 'mock-admin-token',
      admin: {
        _id: 'admin1',
        username: 'admin'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Get candidates
app.get('/getCandidate', (req, res) => {
  res.status(200).json({
    success: true,
    candidate: mockData.candidates
  });
});

// Get specific candidate
app.get('/getCandidate/:id', (req, res) => {
  const candidate = mockData.candidates.find(c => c._id === req.params.id);
  
  if (candidate) {
    res.status(200).json({
      success: true,
      candidate
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Candidate not found'
    });
  }
});

// Update candidate votes
app.patch('/getCandidate/:id', (req, res) => {
  const candidate = mockData.candidates.find(c => c._id === req.params.id);
  
  if (candidate) {
    candidate.votes += 1;
    res.status(200).json({
      success: true,
      votes: candidate.votes
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Candidate not found'
    });
  }
});

// Update voter
app.patch('/updateVoter/:id', (req, res) => {
  const voter = mockData.voters.find(v => v._id === req.params.id);
  
  if (voter) {
    voter.voteStatus = true;
    res.status(200).json({
      success: true,
      voter
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Voter not found'
    });
  }
});

// Get dashboard data
app.get('/getDashboardData', (req, res) => {
  res.status(200).json({
    success: true,
    DashboardData: mockData.dashboardData
  });
});

// Default route
app.get('/', (req, res) => {
  res.send('Online Voting System Mock API is running');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
