const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Import mock database
const mockDb = require('./mockDb');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mock API Routes

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt:', { username, password });

  // Find voter by username or email
  const voter = mockDb.voters.find(v => v.username === username || v.email === username);

  if (!voter) {
    console.log('Voter not found');
    return res.status(200).json({ success: false, message: 'Invalid credentials' });
  }

  // In a real app, we would compare hashed passwords
  // For demo, we'll just check if the password is '123'
  if (password !== '123') {
    console.log('Invalid password');
    return res.status(200).json({ success: false, message: 'Invalid credentials' });
  }

  // Create JWT token
  const token = jwt.sign({ id: voter._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

  console.log('Login successful for:', voter.email);

  res.status(200).json({
    success: true,
    token,
    voterObject: {
      _id: voter._id,
      name: voter.name,
      username: voter.username,
      email: voter.email,
      age: voter.age,
      voteStatus: voter.voteStatus,
      profilePic: voter.profilePic
    }
  });
});

// Admin login route
app.post('/adminlogin', (req, res) => {
  const { username, password } = req.body;

  console.log('Admin login attempt:', { username, password });

  // Find admin by username
  const admin = mockDb.admins.find(a => a.username === username);

  if (!admin) {
    console.log('Admin not found');
    return res.status(200).json({ success: false, message: 'Invalid credentials' });
  }

  // In a real app, we would compare hashed passwords
  // For demo, we'll just check if the password is 'admin@123'
  if (password !== 'admin@123') {
    console.log('Invalid admin password');
    return res.status(200).json({ success: false, message: 'Invalid credentials' });
  }

  // Create JWT token
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

  console.log('Admin login successful for:', admin.username);

  res.status(200).json({
    success: true,
    token,
    admin: {
      _id: admin._id,
      username: admin.username
    }
  });
});

// Get all candidates
app.get('/getCandidate', (req, res) => {
  res.status(200).json({
    success: true,
    candidate: mockDb.candidates
  });
});

// Update candidate votes
app.patch('/getCandidate/:id', (req, res) => {
  const candidate = mockDb.candidates.find(c => c._id === req.params.id);

  if (!candidate) {
    return res.status(404).json({ success: false, message: 'Candidate not found' });
  }

  // Increment votes
  candidate.votes += 1;

  res.status(200).json({
    success: true,
    votes: candidate.votes
  });
});

// Update voter status
app.patch('/updateVoter/:id', (req, res) => {
  const voter = mockDb.voters.find(v => v._id === req.params.id);

  if (!voter) {
    return res.status(404).json({ success: false, message: 'Voter not found' });
  }

  voter.voteStatus = true;

  res.status(200).json({
    success: true,
    voter
  });
});

// Get dashboard data
app.get('/getDashboardData', (req, res) => {
  const voterCount = mockDb.voters.length;
  const candidateCount = mockDb.candidates.length;
  const votersVoted = mockDb.voters.filter(v => v.voteStatus).length;

  res.status(200).json({
    success: true,
    DashboardData: {
      voterCount,
      candidateCount,
      votersVoted
    }
  });
});

// Default route
app.get('/', (req, res) => {
  res.send('Online Voting System API is running');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
