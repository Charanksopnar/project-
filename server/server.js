/**
 * Online Voting System - Main Server
 * 
 * A secure and modern online voting system with:
 * - Voter registration and authentication
 * - Secure voting with JWT tokens
 * - Real-time results and analytics
 * - Admin dashboard capabilities
 * - Optional biometric verification
 * - File upload support
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');
// const mongoose = require('mongoose'); // Removed MongoDB

// Load environment variables
dotenv.config();

// Connect to MongoDB
// Connect to MongoDB
// MongoDB connection removed
console.log('âœ… Using File-Based Storage (MockDb)');
// Initialize data
const Admin = { createDefaultAdmin: () => console.log('Admin initialized') }; // Mock Admin for initialization
Admin.createDefaultAdmin();
// Voter.migrateMockVoters(mockDb.voters); // No need to migrate if using mockDb directly

// Import utilities
const mockDb = require('./mockDb');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
// Models removed
// const Voter = require('./models/Voter'); 
// const Candidate = require('./models/Candidate');
// const Admin = require('./models/Admin');

// Initialize Express app and HTTP server with Socket.io
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Admin whitelist management routes
app.use('/admin/whitelist', require('./routes/whitelistAdmin'));
// Audit routes
app.use('/audit', require('./routes/auditRoutes'));
// Security routes
app.use('/api/security', require('./routes/securityRoutes'));
// KYC admin routes
app.use('/api/kyc', require('./routes/kycRoutes'));
// Dashboard routes
app.use('/api', require('./routes/dashboardRoutes'));

// Admin verification routes (3-layer system)
app.use('/api/admin', require('./routes/adminVerificationRoutes'));
// 3-layer verification routes
app.use('/api/security', require('./routes/threeLayerVerificationRoute'));

// Mount MongoDB Routes
app.use('/', require('./routes/voterRoutes'));
app.use('/', require('./routes/adminRoutes'));
app.use('/', require('./routes/candidateRoutes'));

// Ensure mock admin password is set to environment value or default 'admin@123'
try {
  const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin@123';
  if (mockDb && Array.isArray(mockDb.admins) && mockDb.admins.length > 0) {
    // Hash and set the password for all mock admins to the configured default
    mockDb.admins.forEach((a, idx) => {
      try {
        a.password = bcrypt.hashSync(defaultAdminPassword, 10);
        console.log(`âœ… Set password for mock admin ${a.username || a._id}`);
      } catch (e) {
        console.warn('Failed to set mock admin password for', a.username || a._id, e && e.message);
      }
    });
  }
} catch (err) {
  console.warn('Error ensuring admin password:', err && err.message);
}
// Persist admins to utils/data/admins.json so changes survive restarts
try {
  const dataDir = path.join(__dirname, 'utils', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const adminsFile = path.join(dataDir, 'admins.json');
  fs.writeFileSync(adminsFile, JSON.stringify(mockDb.admins, null, 2), 'utf8');
  console.log(`âœ… Persisted ${mockDb.admins.length} mock admin(s) to utils/data/admins.json`);
} catch (e) {
  console.warn('Failed to persist mock admins to disk:', e && e.message);
}

// ============== SOCKET.IO SETUP ==============
// Store io instance in app for use in routes
app.set('io', io);

// Track connected clients
const connectedClients = new Map();

io.on('connection', (socket) => {
  console.log(`âœ… New client connected: ${socket.id}`);
  connectedClients.set(socket.id, { id: socket.id, connectedAt: new Date() });

  // Helper function to map and populate election data
  const mapElectionData = (elections) => {
    return elections.map(election => {
      // Get candidate details
      const candidateDetails = (election.candidates || []).map(candidateId => {
        const candidate = mockDb.candidates.find(c => c._id === candidateId || c._id.toString() === candidateId.toString());
        return candidate ? {
          _id: candidate._id,
          name: candidate.firstName,
          party: candidate.party
        } : null;
      }).filter(Boolean);

      return {
        ...election,
        name: election.name || election.title, // Map title to name
        title: election.title || election.name, // Keep both for compatibility
        candidateDetails // Add populated candidate details
      };
    });
  };

  // Broadcast initial data
  socket.emit('votersUpdated', mockDb.voters);
  socket.emit('candidatesUpdated', mockDb.candidates);
  socket.emit('electionsUpdated', mapElectionData(mockDb.elections || []));

  // Handle voter updates
  socket.on('updateVoter', (voterData) => {
    console.log(`ðŸ“ Voter update received: ${voterData._id}`);
    const voterIndex = mockDb.voters.findIndex(v => v._id === voterData._id);
    if (voterIndex !== -1) {
      mockDb.voters[voterIndex] = { ...mockDb.voters[voterIndex], ...voterData };
      persistDataFile('voters.json', mockDb.voters);
      io.emit('votersUpdated', mockDb.voters);
    }
  });

  // Handle vote submission
  socket.on('submitVote', async (voteData) => {
    console.log(`ðŸ—³ï¸ Vote received: ${voteData.candidateId}`);
    const candidate = mockDb.candidates.find(c => c._id === voteData.candidateId);
    if (candidate) {
      candidate.votes = (candidate.votes || 0) + 1;
      persistDataFile('candidates.json', mockDb.candidates);

      // Update voter status in MongoDB
      // Update voter status in mockDb
      const voter = mockDb.voters.find(v => v._id === voteData.voterId);
      if (voter) {
        voter.voteStatus = true;
        persistDataFile('voters.json', mockDb.voters);
      }

      // Update mockDb for compatibility (optional)
      const voterMock = mockDb.voters.find(v => v._id === voteData.voterId);
      if (voterMock) {
        voterMock.voteStatus = true;
        persistDataFile('voters.json', mockDb.voters);
      }

      io.emit('voteSubmitted', { candidateId: voteData.candidateId, votes: candidate.votes });
      io.emit('candidatesUpdated', mockDb.candidates);
      io.emit('votersUpdated', mockDb.voters);

      // Emit notification for vote submitted
      io.emit('notification', {
        id: Date.now(),
        type: 'vote_submitted',
        title: 'âœ… Vote Submitted',
        message: `Your vote for "${candidate.firstName}" has been successfully recorded.`,
        data: { candidateName: candidate.firstName, voterId: voteData.voterId },
        timestamp: new Date(),
        read: false
      });
    }
  });

  // Allow client to request a refresh of voters/candidates (useful after REST ops)
  socket.on('requestVotersRefresh', () => {
    try {
      socket.emit('votersUpdated', mockDb.voters);
    } catch (e) {
      logger && logger.error && logger.error('Failed to send votersUpdated', e);
    }
  });

  socket.on('requestCandidatesRefresh', () => {
    try {
      socket.emit('candidatesUpdated', mockDb.candidates);
    } catch (e) {
      logger && logger.error && logger.error('Failed to send candidatesUpdated', e);
    }
  });

  // Handle candidate updates
  socket.on('updateCandidate', (candidateData) => {
    console.log(`ðŸ‘¨â€âš–ï¸ Candidate update received: ${candidateData._id}`);
    const candidateIndex = mockDb.candidates.findIndex(c => c._id === candidateData._id);
    if (candidateIndex !== -1) {
      mockDb.candidates[candidateIndex] = { ...mockDb.candidates[candidateIndex], ...candidateData };
      persistDataFile('candidates.json', mockDb.candidates);
      io.emit('candidatesUpdated', mockDb.candidates);
    }
  });

  // Handle election updates
  socket.on('updateElection', (electionData) => {
    console.log(`ðŸ“‹ Election update received: ${electionData._id}`);
    const electionIndex = mockDb.elections?.findIndex(e => e._id === electionData._id) ?? -1;
    if (electionIndex !== -1) {
      const oldStatus = mockDb.elections[electionIndex].status;
      mockDb.elections[electionIndex] = { ...mockDb.elections[electionIndex], ...electionData };
      persistDataFile('elections.json', mockDb.elections);

      // Emit to all clients
      const mappedElection = mapElectionData([mockDb.elections[electionIndex]])[0];
      io.emit('electionModified', mappedElection);
      io.emit('electionsUpdated', mapElectionData(mockDb.elections));
      io.emit('electionResultsUpdated', mapElectionData(mockDb.elections));

      // Update dashboard stats
      broadcastDashboardUpdate();

      // Emit notification if status changed
      if (oldStatus !== electionData.status) {
        let title = 'ðŸ“… Election Updated';
        let message = `Election status changed to "${electionData.status}".`;

        if (electionData.status === 'started') {
          title = 'ðŸ—³ï¸ Election Started';
          message = `Election "${electionData.name || 'Unnamed'}" has started!`;
        } else if (electionData.status === 'ended') {
          title = 'ðŸ“Š Election Ended';
          message = `Election "${electionData.name || 'Unnamed'}" has ended. Results available now.`;
        }

        io.emit('notification', {
          id: Date.now(),
          type: 'election_update',
          title,
          message,
          data: {
            electionName: electionData.name,
            status: electionData.status,
            startDate: electionData.startDate,
            endDate: electionData.endDate
          },
          timestamp: new Date(),
          read: false
        });
      }
    }
  });

  // Handle create election
  socket.on('createElection', (electionData) => {
    console.log(`âœ¨ Create election received: ${electionData.name}`);
    const newElection = {
      _id: (mockDb.elections?.length || 0) + 1,
      ...electionData,
      status: electionData.status || 'upcoming',
      createdAt: new Date()
    };

    if (!mockDb.elections) mockDb.elections = [];
    mockDb.elections.push(newElection);
    persistDataFile('elections.json', mockDb.elections);

    // Emit to all clients
    const mappedElection = mapElectionData([newElection])[0];
    io.emit('electionCreated', mappedElection);
    io.emit('electionsUpdated', mapElectionData(mockDb.elections));

    // Update dashboard stats
    broadcastDashboardUpdate();

    io.emit('notification', {
      id: Date.now(),
      type: 'new_election',
      title: 'ðŸ—³ï¸ New Election Created',
      message: `Election "${newElection.name}" has been created!`,
      data: {
        electionName: newElection.name,
        startDate: newElection.startDate,
        endDate: newElection.endDate
      },
      timestamp: new Date(),
      read: false
    });
  });

  // Handle change election status
  socket.on('changeElectionStatus', (data) => {
    console.log(`ðŸ“Š Change election status: ${data.electionId} to ${data.status}`);
    if (mockDb.elections) {
      const election = mockDb.elections.find(e => e._id === data.electionId || e._id.toString() === data.electionId.toString());
      if (election) {
        const oldStatus = election.status;
        election.status = data.status;
        persistDataFile('elections.json', mockDb.elections);

        // Emit to all clients
        const mappedElection = mapElectionData([election])[0];
        io.emit('electionStatusChanged', mappedElection);
        io.emit('electionsUpdated', mapElectionData(mockDb.elections));

        // Update dashboard stats
        broadcastDashboardUpdate();

        // Emit notification
        let title = 'ðŸ“… Election Updated';
        let message = `Election status changed to "${data.status}".`;

        if (data.status === 'current') {
          title = 'ðŸ—³ï¸ Election Started';
          message = `Election "${election.name}" has started! You can now vote.`;
        } else if (data.status === 'stopped') {
          title = 'â¹ï¸ Election Stopped';
          message = `Election "${election.name}" has been stopped.`;
        } else if (data.status === 'completed') {
          title = 'ðŸ“Š Election Completed';
          message = `Election "${election.name}" has been completed. Results available now.`;
        }

        io.emit('notification', {
          id: Date.now(),
          type: 'election_update',
          title,
          message,
          data: {
            electionName: election.name,
            oldStatus,
            newStatus: data.status,
            startDate: election.startDate,
            endDate: election.endDate
          },
          timestamp: new Date(),
          read: false
        });
      }
    }
  });

  // Handle modify election
  socket.on('modifyElection', (electionData) => {
    console.log(`âœï¸ Modify election received: ${electionData._id}`);
    if (mockDb.elections) {
      const electionIndex = mockDb.elections.findIndex(e => e._id === electionData._id || e._id.toString() === electionData._id.toString());
      if (electionIndex !== -1) {
        const oldElection = mockDb.elections[electionIndex];
        mockDb.elections[electionIndex] = { ...oldElection, ...electionData, _id: oldElection._id, createdAt: oldElection.createdAt };
        persistDataFile('elections.json', mockDb.elections);

        // Emit to all clients
        const mappedElection = mapElectionData([mockDb.elections[electionIndex]])[0];
        io.emit('electionModified', mappedElection);
        io.emit('electionsUpdated', mapElectionData(mockDb.elections));

        // Update dashboard stats
        broadcastDashboardUpdate();

        io.emit('notification', {
          id: Date.now(),
          type: 'election_update',
          title: 'âœï¸ Election Modified',
          message: `Election "${electionData.name}" has been updated.`,
          data: {
            electionName: electionData.name,
            startDate: electionData.startDate,
            endDate: electionData.endDate
          },
          timestamp: new Date(),
          read: false
        });
      }
    }
  });

  // Handle delete election
  socket.on('deleteElection', (data) => {
    console.log(`ðŸ—‘ï¸ Delete election: ${data.electionId}`);
    if (mockDb.elections) {
      const electionIndex = mockDb.elections.findIndex(e => e._id === data.electionId || e._id.toString() === data.electionId.toString());
      if (electionIndex !== -1) {
        const deletedElection = mockDb.elections[electionIndex];
        mockDb.elections.splice(electionIndex, 1);
        persistDataFile('elections.json', mockDb.elections);

        // Emit to all clients
        const mappedDeleted = mapElectionData([deletedElection])[0];
        io.emit('electionDeleted', mappedDeleted);
        io.emit('electionsUpdated', mapElectionData(mockDb.elections));

        // Update dashboard stats
        broadcastDashboardUpdate();

        io.emit('notification', {
          id: Date.now(),
          type: 'election_update',
          title: 'ðŸ—‘ï¸ Election Deleted',
          message: `Election "${deletedElection.name}" has been deleted.`,
          data: { electionName: deletedElection.name },
          timestamp: new Date(),
          read: false
        });
      }
    }
  });

  // Handle update election region
  socket.on('updateElectionRegion', (data) => {
    console.log(`ðŸŒ Update election region: ${data.electionId} to ${data.region}`);
    if (mockDb.elections) {
      const election = mockDb.elections.find(e => e._id === data.electionId || e._id.toString() === data.electionId.toString());
      if (election) {
        election.region = data.region;
        persistDataFile('elections.json', mockDb.elections);

        // Emit to all clients
        const mappedElection = mapElectionData([election])[0];
        io.emit('regionElectionChanged', mappedElection);
        io.emit('electionsUpdated', mapElectionData(mockDb.elections));
      }
    }
  });

  // Handle add candidate to election
  socket.on('addCandidateToElection', (data) => {
    console.log(`âž• Add candidate to election: ${data.electionId}`);
    const { electionId, candidate } = data;

    // Add to candidates list
    if (!mockDb.candidates) mockDb.candidates = [];
    const newCandidate = {
      _id: candidate._id || Date.now().toString(),
      firstName: candidate.name,
      party: candidate.party,
      image: candidate.photoUrl || 'default-candidate.jpg',
      votes: 0,
      ...candidate
    };
    mockDb.candidates.push(newCandidate);
    persistDataFile('candidates.json', mockDb.candidates);

    // Link to election
    if (mockDb.elections) {
      const election = mockDb.elections.find(e => e._id === electionId || e._id.toString() === electionId.toString());
      if (election) {
        if (!election.candidates) election.candidates = [];
        election.candidates.push(newCandidate._id);
        persistDataFile('elections.json', mockDb.elections);

        // Emit updates
        io.emit('candidatesUpdated', mockDb.candidates);
        io.emit('electionsUpdated', mapElectionData(mockDb.elections));
        io.emit('candidateChanged', { electionId, candidate: newCandidate });
      }
    }
  });

  // Handle request elections sync
  socket.on('requestElectionsSync', () => {
    console.log(`ðŸ”„ Elections sync requested by ${socket.id}`);
    try {
      const elections = mockDb.elections || [];
      const mappedElections = mapElectionData(elections);
      socket.emit('electionsUpdated', mappedElections);
      console.log(`âœ… Sent ${mappedElections.length} elections to client ${socket.id}`);
    } catch (error) {
      console.error('Error sending elections sync:', error);
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`âŒ Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
  });

  // Error handler
  socket.on('error', (error) => {
    console.error(`ðŸ”´ Socket error from ${socket.id}:`, error);
  });
});

// Function to broadcast dashboard updates
function broadcastDashboardUpdate() {
  const dashboardData = {
    voterCount: mockDb.voters.length,
    candidateCount: mockDb.candidates.length,
    votersVoted: mockDb.voters.filter(v => v.voteStatus).length,
    totalVotes: mockDb.candidates.reduce((sum, c) => sum + (c.votes || 0), 0)
  };
  io.emit('dashboardDataUpdated', dashboardData);
}

// Create necessary directories
const directories = ['uploads', 'logs'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Helper to persist mock data arrays to JSON files under `utils/data/`
function persistDataFile(filename, data) {
  try {
    const file = path.join(__dirname, 'utils', 'data', filename);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    logger && logger.error ? logger.error(`Failed to persist ${filename}`, err) : console.error(`Failed to persist ${filename}`, err);
  }
}

// ============== AUTHENTICATION ROUTES ==============

/*
// Voter Login (Mock) - Commented out to use voterRoutes.js
app.post('/login', async (req, res) => {
  // ... mock login implementation ...
  return res.status(401).json({ success: false, message: 'Please check server.js - using MongoDB routes now' });
});
*/

/*
// Register a new voter (Mock) - Commented out to use voterRoutes.js
app.post('/createVoter', upload.any(), async (req, res) => {
  // ... mock registration ...
  return res.status(500).json({ success: false, message: 'Please check server.js - using MongoDB routes now' });
});
*/

/*
// Admin Login (Mock) - Commented out to use adminRoutes.js
app.post('/adminlogin', async (req, res) => {
  // ... mock admin login ...
  return res.status(401).json({ success: false, message: 'Please check server.js - using MongoDB routes now' });
});
*/

// ============== VOTER ROUTES ==============

/*
// Get all voters (Mock) - Commented out
app.get('/getVoter', (req, res) => {
  // ...
});
*/

/*
// Get voter by ID (Mock) - Commented out
app.get('/getVoterbyID/:id', (req, res) => {
  // ...
});
*/

/*
// Update voter status (Mock) - Commented out
app.patch('/updateVoter/:id', (req, res) => {
  // ...
});
*/

/*
// Update voter details (Mock) - Commented out
app.patch('/updateVoterDetails/:id', upload.single('image'), (req, res) => {
  // ...
});
*/

// Update voter block status (block/unblock)
app.patch('/updateVoterBlock/:id', (req, res) => {
  try {
    const voter = mockDb.voters.find(v => v._id === req.params.id);

    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    const { isBlocked, blockedReason, violationDescription, blockedBy, blockExpiryDate, reviewDate } = req.body;

    voter.isBlocked = isBlocked || false;
    voter.blockedReason = isBlocked ? blockedReason : null;
    voter.violationDescription = isBlocked ? violationDescription : null;
    voter.blockedAt = isBlocked ? new Date() : null;
    voter.blockedBy = isBlocked ? (blockedBy || 'admin') : null;
    voter.blockExpiryDate = isBlocked && blockExpiryDate ? new Date(blockExpiryDate) : null;
    voter.reviewDate = isBlocked && reviewDate ? new Date(reviewDate) : null;

    logger.info(`Voter ${voter._id} ${isBlocked ? 'blocked' : 'unblocked'}`);

    // Log to audit trail
    const auditEntry = {
      id: `audit_block_${Date.now()}`,
      action: isBlocked ? 'BLOCK_VOTER' : 'UNBLOCK_VOTER',
      voterId: voter._id,
      voterName: `${voter.firstName || ''} ${voter.lastName || voter.name || ''}`.trim(),
      email: voter.email,
      reason: blockedReason || null,
      description: violationDescription || null,
      blockedBy: blockedBy || 'admin',
      timestamp: new Date().toISOString(),
      details: {
        voterEmail: voter.email,
        voterPhone: voter.phone,
        voterAge: voter.age
      }
    };

    // Append to audit log file
    const auditDir = path.join(__dirname, 'utils', 'data');
    const auditFile = path.join(auditDir, 'voterBlockAudit.json');

    try {
      if (!fs.existsSync(auditDir)) {
        fs.mkdirSync(auditDir, { recursive: true });
      }

      let auditLogs = [];
      if (fs.existsSync(auditFile)) {
        try {
          const data = fs.readFileSync(auditFile, 'utf8');
          auditLogs = data ? JSON.parse(data) : [];
        } catch (e) {
          auditLogs = [];
        }
      }

      auditLogs.push(auditEntry);
      fs.writeFileSync(auditFile, JSON.stringify(auditLogs, null, 2));
    } catch (err) {
      logger.error('Error writing audit log:', err);
    }

    // Persist updated voters list to file
    persistDataFile('voters.json', mockDb.voters);

    res.status(200).json({
      success: true,
      message: isBlocked ? 'Voter blocked successfully' : 'Voter unblocked successfully',
      voter,
      auditId: auditEntry.id
    });
  } catch (err) {
    logger.error('Error updating voter block status', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get voter blocking audit trail (admin only)
app.get('/getVoterBlockAudit', (req, res) => {
  try {
    const auditFile = path.join(__dirname, 'utils', 'data', 'voterBlockAudit.json');
    let auditLogs = [];

    if (fs.existsSync(auditFile)) {
      try {
        const data = fs.readFileSync(auditFile, 'utf8');
        auditLogs = data ? JSON.parse(data) : [];
      } catch (e) {
        auditLogs = [];
      }
    }

    // Sort by timestamp descending (most recent first)
    auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      auditLogs: auditLogs,
      totalRecords: auditLogs.length
    });
  } catch (err) {
    logger.error('Error retrieving voter block audit trail', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk block/unblock voters
app.post('/bulkBlockVoters', (req, res) => {
  try {
    const { voterIds, isBlocked, blockedReason, violationDescription, blockedBy, blockExpiryDate, reviewDate } = req.body;

    if (!Array.isArray(voterIds) || voterIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid voter IDs provided' });
    }

    const results = {
      successful: [],
      failed: [],
      totalProcessed: voterIds.length
    };

    voterIds.forEach(voterId => {
      try {
        const voter = mockDb.voters.find(v => v._id === voterId);

        if (!voter) {
          results.failed.push({ voterId, reason: 'Voter not found' });
          return;
        }

        // Update voter block status
        voter.isBlocked = isBlocked || false;
        voter.blockedReason = isBlocked ? blockedReason : null;
        voter.violationDescription = isBlocked ? violationDescription : null;
        voter.blockedAt = isBlocked ? new Date() : null;
        voter.blockedBy = isBlocked ? (blockedBy || 'admin') : null;
        voter.blockExpiryDate = isBlocked && blockExpiryDate ? new Date(blockExpiryDate) : null;
        voter.reviewDate = isBlocked && reviewDate ? new Date(reviewDate) : null;

        // Create audit entry
        const auditEntry = {
          id: `audit_block_${Date.now()}_${voterId}`,
          action: isBlocked ? 'BULK_BLOCK_VOTER' : 'BULK_UNBLOCK_VOTER',
          voterId: voter._id,
          voterName: `${voter.firstName || ''} ${voter.lastName || voter.name || ''}`.trim(),
          email: voter.email,
          reason: blockedReason || null,
          description: violationDescription || null,
          blockedBy: blockedBy || 'admin',
          timestamp: new Date().toISOString(),
          isBulkOperation: true,
          details: {
            voterEmail: voter.email,
            voterPhone: voter.phone,
            voterAge: voter.age
          }
        };

        // Append to audit log
        const auditFile = path.join(__dirname, 'utils', 'data', 'voterBlockAudit.json');
        try {
          let auditLogs = [];
          if (fs.existsSync(auditFile)) {
            const data = fs.readFileSync(auditFile, 'utf8');
            auditLogs = data ? JSON.parse(data) : [];
          }
          auditLogs.push(auditEntry);
          fs.writeFileSync(auditFile, JSON.stringify(auditLogs, null, 2));
        } catch (err) {
          logger.error('Error writing audit log for bulk operation:', err);
        }

        results.successful.push({ voterId, voterName: auditEntry.voterName });
      } catch (err) {
        results.failed.push({ voterId, reason: err.message });
      }
    });

    // Persist updated voters list to file
    persistDataFile('voters.json', mockDb.voters);

    logger.info(`Bulk ${isBlocked ? 'blocked' : 'unblocked'} ${results.successful.length} voters`);

    res.status(200).json({
      success: true,
      message: `${isBlocked ? 'Blocked' : 'Unblocked'} ${results.successful.length} voter(s)`,
      results
    });
  } catch (err) {
    logger.error('Error bulk blocking voters', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============== CANDIDATE ROUTES ==============

/*
// Get all candidates (Mock) - Commented out to use candidateRoutes.js
app.get('/getCandidate', (req, res) => {
  // ...
});

// Update candidate votes (Mock) - Commented out
app.patch('/getCandidate/:id', (req, res) => {
  // ...
});

// Create a new candidate (Mock) - Commented out
app.post('/createCandidate', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'symbol', maxCount: 1 }
]), (req, res) => {
  // ...
});
*/

// ============== ELECTION ROUTES ==============

// Create a new election
app.post('/createElection', (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'name, startDate, and endDate are required'
      });
    }

    const newId = (mockDb.elections?.length || 0) + 1;
    const newElection = {
      _id: newId.toString(),
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'upcoming',
      createdAt: new Date()
    };

    if (!mockDb.elections) mockDb.elections = [];
    mockDb.elections.push(newElection);
    persistDataFile('elections.json', mockDb.elections);

    // Emit real-time updates to all connected clients
    io.emit('electionCreated', newElection);
    io.emit('electionsUpdated', mockDb.elections);

    // Emit notification
    io.emit('notification', {
      id: Date.now(),
      type: 'new_election',
      title: 'ðŸ—³ï¸ New Election Created',
      message: `Election "${name}" has been created!`,
      data: {
        electionName: name,
        startDate: startDate,
        endDate: endDate
      },
      timestamp: new Date(),
      read: false
    });

    logger.info(`New election created: ${name}`);

    res.status(201).json({
      success: true,
      election: newElection
    });
  } catch (error) {
    logger.error('Error creating election', error);
    res.status(500).json({
      success: false,
      message: 'Error creating election',
      error: error.message
    });
  }
});

// Get all elections
app.get('/getElections', (req, res) => {
  try {
    const elections = mockDb.elections || [];
    res.status(200).json({
      success: true,
      elections
    });
  } catch (err) {
    logger.error('Error fetching elections', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get upcoming elections
app.get('/getUpcomingElections', (req, res) => {
  try {
    const now = new Date();
    const upcomingElections = (mockDb.elections || []).filter(
      el => new Date(el.startDate) > now && (el.status === 'upcoming' || el.status === 'current')
    );
    res.status(200).json({
      success: true,
      elections: upcomingElections
    });
  } catch (err) {
    logger.error('Error fetching upcoming elections', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update an election (PATCH endpoint)
app.patch('/updateElection/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, status } = req.body;

    const electionIndex = (mockDb.elections || []).findIndex(
      el => el._id === id || el._id.toString() === id.toString()
    );

    if (electionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    const oldElection = mockDb.elections[electionIndex];
    const oldStatus = oldElection.status;

    // Update election fields
    if (name !== undefined) mockDb.elections[electionIndex].name = name;
    if (description !== undefined) mockDb.elections[electionIndex].description = description;
    if (startDate !== undefined) mockDb.elections[electionIndex].startDate = new Date(startDate);
    if (endDate !== undefined) mockDb.elections[electionIndex].endDate = new Date(endDate);
    if (status !== undefined) mockDb.elections[electionIndex].status = status;

    mockDb.elections[electionIndex].updatedAt = new Date();
    persistDataFile('elections.json', mockDb.elections);

    const updatedElection = mockDb.elections[electionIndex];

    // Emit real-time updates
    io.emit('electionModified', updatedElection);
    io.emit('electionsUpdated', mockDb.elections);
    broadcastDashboardUpdate();

    // Emit notification if status changed
    if (status && oldStatus !== status) {
      let title = 'ðŸ“… Election Updated';
      let message = `Election status changed to "${status}".`;

      if (status === 'current') {
        title = 'ðŸ—³ï¸ Election Started';
        message = `Election "${name || oldElection.name}" has started! You can now vote.`;
      } else if (status === 'stopped') {
        title = 'â¹ï¸ Election Stopped';
        message = `Election "${name || oldElection.name}" has been stopped.`;
      } else if (status === 'completed') {
        title = 'ðŸ“Š Election Completed';
        message = `Election "${name || oldElection.name}" has been completed. Results available now.`;
      }

      io.emit('notification', {
        id: Date.now(),
        type: 'election_update',
        title,
        message,
        data: {
          electionName: name || oldElection.name,
          oldStatus,
          newStatus: status,
          startDate: startDate || oldElection.startDate,
          endDate: endDate || oldElection.endDate
        },
        timestamp: new Date(),
        read: false
      });
    }

    logger.info(`Election ${id} updated successfully`);

    res.status(200).json({
      success: true,
      message: 'Election updated successfully',
      election: updatedElection
    });
  } catch (error) {
    logger.error('Error updating election', error);
    res.status(500).json({
      success: false,
      message: 'Error updating election',
      error: error.message
    });
  }
});

// Delete an election
app.delete('/deleteElection/:id', (req, res) => {
  try {
    const { id } = req.params;

    const electionIndex = (mockDb.elections || []).findIndex(
      el => el._id === id || el._id.toString() === id.toString()
    );

    if (electionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    const deletedElection = mockDb.elections.splice(electionIndex, 1)[0];
    persistDataFile('elections.json', mockDb.elections);

    // Emit real-time updates
    io.emit('electionDeleted', deletedElection);
    io.emit('electionsUpdated', mockDb.elections);
    broadcastDashboardUpdate();

    io.emit('notification', {
      id: Date.now(),
      type: 'election_update',
      title: 'ðŸ—‘ï¸ Election Deleted',
      message: `Election "${deletedElection.name}" has been deleted.`,
      data: { electionName: deletedElection.name },
      timestamp: new Date(),
      read: false
    });

    logger.info(`Election ${id} deleted successfully`);

    res.status(200).json({
      success: true,
      message: 'Election deleted successfully',
      election: deletedElection
    });
  } catch (error) {
    logger.error('Error deleting election', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting election',
      error: error.message
    });
  }
});

// ============== DASHBOARD ROUTES ==============

// Get dashboard data
app.get('/getDashboardData', (req, res) => {
  try {
    const voterCount = mockDb.voters.length;
    const candidateCount = mockDb.candidates.length;
    const votersVoted = mockDb.voters.filter(v => v.voteStatus).length;
    const totalVotes = mockDb.candidates.reduce((sum, c) => sum + c.votes, 0);

    res.status(200).json({
      success: true,
      DashboardData: {
        voterCount,
        candidateCount,
        votersVoted,
        totalVotes,
        votingPercentage: ((votersVoted / voterCount) * 100).toFixed(2)
      }
    });
  } catch (err) {
    logger.error('Error fetching dashboard data', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============== BIOMETRICS ROUTES (Optional) ==============
// Uncomment to enable biometric verification
// app.use('/biometrics', require('./routes/biometricsRoutes'));

// ============== OTHER ROUTES ==============

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.send(`
    <h1>ðŸ—³ï¸ Online Voting System API</h1>
    <p>Server is running successfully!</p>
    <h2>ðŸ“š API Endpoints</h2>
    <h3>Authentication</h3>
    <ul>
      <li><strong>POST /login</strong> - Voter login</li>
      <li><strong>POST /adminlogin</strong> - Admin login</li>
    </ul>
    <h3>Voters</h3>
    <ul>
      <li><strong>GET /getVoter</strong> - Get all voters</li>
      <li><strong>GET /getVoterbyID/:id</strong> - Get voter by ID</li>
      <li><strong>PATCH /updateVoter/:id</strong> - Update voter status</li>
    </ul>
    <h3>Candidates</h3>
    <ul>
      <li><strong>GET /getCandidate</strong> - Get all candidates</li>
      <li><strong>PATCH /getCandidate/:id</strong> - Cast vote for candidate</li>
      <li><strong>POST /createCandidate</strong> - Create new candidate (admin)</li>
    </ul>
    <h3>Dashboard</h3>
    <ul>
      <li><strong>GET /getDashboardData</strong> - Get dashboard statistics</li>
    </ul>
    <h3>System</h3>
    <ul>
      <li><strong>GET /health</strong> - Health check</li>
    </ul>
  `);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler middleware
app.use(errorHandler);

// Start server with Socket.io
// Start server with EADDRINUSE handling - try next ports if needed
function startServer(port, attempts = 5) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`\nðŸ—³ï¸  Online Voting System Server`);
    console.log(`========================================`);
    console.log(`âœ“ Server running on port ${port}`);
    console.log(`âœ“ Environment: ${NODE_ENV}`);
    console.log(`âœ“ Socket.io enabled for real-time updates`);
    console.log(`âœ“ API Documentation: http://localhost:${port}/`);
    console.log(`âœ“ Health Check: http://localhost:${port}/health`);
    console.log(`âœ“ WebSocket Server: ws://localhost:${port}`);
    console.log(`========================================\n`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attempts > 0) {
      console.warn(`âš ï¸ Port ${port} in use. Trying port ${port + 1}...`);
      setTimeout(() => {
        startServer(port + 1, attempts - 1);
      }, 500);
    } else if (err) {
      console.error('ðŸ”´ Server error:', err);
      process.exit(1);
    }
  });
}

startServer(Number(PORT));
