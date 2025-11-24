const express = require('express');
const router = express.Router();
const mockDb = require('../mockDb');
const { adminAuth } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Get dashboard data
router.get('/getDashboardData', async (req, res) => {
  try {
    // Count voters
    const voterCount = mockDb.voters.length;

    // Count candidates
    const candidateCount = mockDb.candidates.length;

    // Count voters who have voted
    const votersVoted = mockDb.voters.filter(v => v.voteStatus).length;

    res.status(200).json({
      success: true,
      DashboardData: {
        voterCount,
        candidateCount,
        votersVoted
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Create a new election
router.post('/createElection', adminAuth, async (req, res) => {
  try {
    const { title, description, startDate, endDate, candidateIds } = req.body;

    // Create new election
    const newElection = {
      _id: (mockDb.elections.length + 1).toString(),
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      candidates: candidateIds || [],
      status: 'upcoming',
      createdAt: new Date()
    };

    mockDb.elections.push(newElection);

    res.status(201).json({
      success: true,
      message: 'Election created successfully',
      election: newElection
    });
  } catch (error) {
    console.error('Error creating election:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all elections
router.get('/getElections', async (req, res) => {
  try {
    // Populate candidates
    const elections = mockDb.elections.map(election => {
      const populatedCandidates = (election.candidates || []).map(id =>
        mockDb.candidates.find(c => c._id === id || c._id.toString() === id.toString())
      ).filter(Boolean);
      return { ...election, candidates: populatedCandidates };
    });

    res.status(200).json({
      success: true,
      elections
    });
  } catch (error) {
    console.error('Error getting elections:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get upcoming elections
router.get('/getUpcomingElections', async (req, res) => {
  try {
    const currentDate = new Date();

    const upcomingElections = mockDb.elections.filter(e => new Date(e.startDate) > currentDate)
      .map(election => {
        const populatedCandidates = (election.candidates || []).map(id =>
          mockDb.candidates.find(c => c._id === id || c._id.toString() === id.toString())
        ).filter(Boolean);
        return { ...election, candidates: populatedCandidates };
      });

    res.status(200).json({
      success: true,
      elections: upcomingElections
    });
  } catch (error) {
    console.error('Error getting upcoming elections:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get ongoing elections
router.get('/getOngoingElections', async (req, res) => {
  try {
    const currentDate = new Date();

    const ongoingElections = mockDb.elections.filter(e =>
      new Date(e.startDate) <= currentDate && new Date(e.endDate) >= currentDate
    ).map(election => {
      const populatedCandidates = (election.candidates || []).map(id =>
        mockDb.candidates.find(c => c._id === id || c._id.toString() === id.toString())
      ).filter(Boolean);
      return { ...election, candidates: populatedCandidates };
    });

    res.status(200).json({
      success: true,
      elections: ongoingElections
    });
  } catch (error) {
    console.error('Error getting ongoing elections:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get election results
router.get('/getElectionResults/:id', async (req, res) => {
  try {
    const election = mockDb.elections.find(e => e._id === req.params.id || e._id.toString() === req.params.id);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    // Get candidates with their vote counts
    const candidatesWithVotes = (election.candidates || []).map(id => {
      const candidate = mockDb.candidates.find(c => c._id === id || c._id.toString() === id.toString());
      if (!candidate) return null;
      return {
        _id: candidate._id,
        name: candidate.firstName,
        party: candidate.party,
        votes: candidate.votes || 0
      };
    }).filter(Boolean);

    res.status(200).json({
      success: true,
      election: {
        _id: election._id,
        title: election.title,
        description: election.description,
        startDate: election.startDate,
        endDate: election.endDate,
        status: election.status,
        candidates: candidatesWithVotes
      }
    });
  } catch (error) {
    console.error('Error getting election results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update election region
router.post('/updateElectionRegion/:id', adminAuth, async (req, res) => {
  try {
    const { region } = req.body;
    const election = mockDb.elections.find(e => e._id === req.params.id || e._id.toString() === req.params.id);

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    election.region = region;

    res.status(200).json({
      success: true,
      message: 'Election region updated',
      election
    });
  } catch (error) {
    console.error('Error updating election region:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Add candidate to election
router.post('/addCandidateToElection/:id', adminAuth, async (req, res) => {
  try {
    const { candidateId } = req.body;
    const election = mockDb.elections.find(e => e._id === req.params.id || e._id.toString() === req.params.id);

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    // Check if candidate exists
    const candidate = mockDb.candidates.find(c => c._id === candidateId || c._id.toString() === candidateId.toString());
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Check if already added
    if (!election.candidates) election.candidates = [];
    if (election.candidates.includes(candidateId)) {
      return res.status(400).json({ success: false, message: 'Candidate already added to this election' });
    }

    election.candidates.push(candidateId);

    res.status(200).json({
      success: true,
      message: 'Candidate added successfully',
      election
    });
  } catch (error) {
    console.error('Error adding candidate:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Remove candidate from election
router.delete('/removeCandidateFromElection/:id', adminAuth, async (req, res) => {
  try {
    const { candidateId } = req.body;
    const election = mockDb.elections.find(e => e._id === req.params.id || e._id.toString() === req.params.id);

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    // Check if candidates array exists
    if (!election.candidates || election.candidates.length === 0) {
      return res.status(400).json({ success: false, message: 'No candidates in this election' });
    }

    // Find and remove candidate
    const candidateIndex = election.candidates.findIndex(id =>
      id === candidateId || id.toString() === candidateId.toString()
    );

    if (candidateIndex === -1) {
      return res.status(404).json({ success: false, message: 'Candidate not found in this election' });
    }

    election.candidates.splice(candidateIndex, 1);

    res.status(200).json({
      success: true,
      message: 'Candidate removed successfully',
      election
    });
  } catch (error) {
    console.error('Error removing candidate:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get candidates for an election
router.get('/getElectionCandidates/:id', async (req, res) => {
  try {
    const election = mockDb.elections.find(e => e._id === req.params.id || e._id.toString() === req.params.id);
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }
    res.status(200).json({
      success: true,
      candidates: election.candidates
    });
  } catch (error) {
    console.error('Error getting candidates:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Search candidates
router.get('/searchCandidates', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query parameter is required' });
    }

    const candidates = mockDb.candidates.filter(c =>
      c.firstName.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    res.status(200).json({
      success: true,
      candidates
    });
  } catch (error) {
    console.error('Error searching candidates:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get invalid votes
router.get('/getInvalidVotes', async (req, res) => {
  try {
    const dataDir = path.join(__dirname, '..', 'utils', 'data');
    const invalidFile = path.join(dataDir, 'invalidVotes.json');
    let invalidVotes = [];

    if (fs.existsSync(invalidFile)) {
      try {
        const raw = fs.readFileSync(invalidFile, 'utf8');
        invalidVotes = raw ? JSON.parse(raw) : [];
      } catch (e) {
        invalidVotes = mockDb.invalidVotes || [];
      }
    } else {
      invalidVotes = mockDb.invalidVotes || [];
    }

    res.status(200).json({
      success: true,
      invalidVotes: invalidVotes,
      totalRecords: invalidVotes.length
    });
  } catch (error) {
    console.error('Error fetching invalid votes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get audit records
router.get('/getAuditRecords', adminAuth, async (req, res) => {
  try {
    const dataDir = path.join(__dirname, '..', 'utils', 'data');
    const auditFile = path.join(dataDir, 'auditLogs.json');
    let auditRecords = [];

    if (fs.existsSync(auditFile)) {
      try {
        const raw = fs.readFileSync(auditFile, 'utf8');
        auditRecords = raw ? JSON.parse(raw) : [];
      } catch (e) {
        auditRecords = mockDb.auditRecords || [];
      }
    } else {
      auditRecords = mockDb.auditRecords || [];
    }

    // Sort by timestamp descending (most recent first)
    const sortedRecords = auditRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      audits: sortedRecords,
      totalRecords: sortedRecords.length
    });
  } catch (error) {
    console.error('Error fetching audit records:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
