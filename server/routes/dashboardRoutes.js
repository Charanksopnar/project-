const express = require('express');
const router = express.Router();
const Voter = require('../models/Voter');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const { adminAuth } = require('../middleware/auth');

// Get dashboard data
router.get('/getDashboardData', async (req, res) => {
  try {
    // Count voters
    const voterCount = await Voter.countDocuments();
    
    // Count candidates
    const candidateCount = await Candidate.countDocuments();
    
    // Count voters who have voted
    const votersVoted = await Voter.countDocuments({ voteStatus: true });
    
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
    const newElection = new Election({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      candidates: candidateIds || []
    });
    
    await newElection.save();
    
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
    const elections = await Election.find().populate('candidates');
    
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
    
    const upcomingElections = await Election.find({
      startDate: { $gt: currentDate }
    }).populate('candidates');
    
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
    
    const ongoingElections = await Election.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).populate('candidates');
    
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
    const election = await Election.findById(req.params.id).populate('candidates');
    
    if (!election) {
      return res.status(404).json({ 
        success: false, 
        message: 'Election not found' 
      });
    }
    
    // Get candidates with their vote counts
    const candidatesWithVotes = await Promise.all(
      election.candidates.map(async (candidateId) => {
        const candidate = await Candidate.findById(candidateId);
        return {
          _id: candidate._id,
          name: candidate.firstName,
          party: candidate.party,
          votes: candidate.votes
        };
      })
    );
    
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

module.exports = router;
