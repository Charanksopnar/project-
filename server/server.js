const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Use local mock DB (no MongoDB)
const mockDb = require('./mockDb');

// Load environment variables
dotenv.config();


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
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt:', { username });

  // Find voter by username or email
  const voter = mockDb.voters.find(v => v.username === username || v.email === username);

  if (!voter) {
    console.log('Voter not found');
    return res.status(200).json({ success: false, message: 'Invalid credentials' });
  }

  try {
    // Compare provided password with stored hashed password
    const match = await bcrypt.compare(password || '', voter.password || '');

    if (!match) {
      console.log('Invalid password');
      return res.status(200).json({ success: false, message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: voter._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    console.log('Login successful for:', voter.email);

    return res.status(200).json({
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
  } catch (err) {
    console.error('Error during login password comparison:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin login route
app.post('/adminlogin', async (req, res) => {
  const { username, password } = req.body;

  console.log('Admin login attempt:', { username });

  // Find admin by username
  const admin = mockDb.admins.find(a => a.username === username);

  if (!admin) {
    console.log('Admin not found');
    return res.status(200).json({ success: false, message: 'Invalid credentials' });
  }

  try {
    const match = await bcrypt.compare(password || '', admin.password || '');

    if (!match) {
      console.log('Invalid admin password');
      return res.status(200).json({ success: false, message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    console.log('Admin login successful for:', admin.username);

    return res.status(200).json({
      success: true,
      token,
      admin: {
        _id: admin._id,
        username: admin.username
      }
    });
  } catch (err) {
    console.error('Error during admin password comparison:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
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

// Biometrics routes (Python verifier wrapper)
app.use('/biometrics', require('./routes/biometricsRoutes'));

// Default route
app.get('/', (req, res) => {
  res.send(`
    <h1>🗳️ Online Voting System API</h1>
    <p>Server is running successfully!</p>
    <h2>📚 API Documentation</h2>
    <ul>
      <li>POST /createVoter - Register a new voter</li>
      <li>POST /login - Login voter</li>
      <li>GET /getCandidate - Get all candidates</li>
      <li>GET /getDashboardData - Get dashboard statistics</li>
    </ul>
  `);
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
