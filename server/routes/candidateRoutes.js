const express = require('express');
const router = express.Router();
const mockDb = require('../mockDb');
const { upload } = require('../middleware/upload');
const { adminAuth } = require('../middleware/auth');
let io = null;

// Set Socket.io instance for notifications
router.setIO = function (socketIO) {
  io = socketIO;
};

// Emit notification helper
const emitNotification = (type, title, message, data = {}) => {
  if (io) {
    io.emit('notification', {
      id: Date.now(),
      type,
      title,
      message,
      data,
      timestamp: new Date(),
      read: false
    });
  }
};

// Create a new candidate
router.post('/createCandidate', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'symbol', maxCount: 1 }
]), async (req, res) => {
  try {
    const { firstName, age, party, bio } = req.body;

    // Create new candidate
    const newCandidate = {
      _id: (mockDb.candidates.length + 1).toString(),
      firstName,
      age: parseInt(age),
      party,
      bio,
      image: req.files.image ? req.files.image[0].filename : 'default-candidate.jpg',
      symbol: req.files.symbol ? req.files.symbol[0].filename : 'default-symbol.jpg',
      votes: 0,
      createdAt: new Date()
    };

    mockDb.candidates.push(newCandidate);

    // Emit notification
    emitNotification(
      'candidate_created',
      '✨ New Candidate',
      `Candidate "${firstName}" has been successfully created!`,
      { candidateName: firstName, party: party }
    );

    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      candidate: newCandidate
    });
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all candidates
router.get('/getCandidate', async (req, res) => {
  try {
    const candidates = mockDb.candidates;

    res.status(200).json({
      success: true,
      candidate: candidates
    });
  } catch (error) {
    console.error('Error getting candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get a specific candidate
router.get('/getCandidate/:id', async (req, res) => {
  try {
    const candidate = mockDb.candidates.find(c => c._id === req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      candidate
    });
  } catch (error) {
    console.error('Error getting candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update candidate votes
router.patch('/getCandidate/:id', async (req, res) => {
  try {
    const candidate = mockDb.candidates.find(c => c._id === req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Increment votes
    candidate.votes = (candidate.votes || 0) + 1;

    res.status(200).json({
      success: true,
      votes: candidate.votes
    });
  } catch (error) {
    console.error('Error updating candidate votes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete a candidate (admin only)
router.delete('/deleteCandidate/:id', adminAuth, async (req, res) => {
  try {
    const index = mockDb.candidates.findIndex(c => c._id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const candidate = mockDb.candidates[index];
    mockDb.candidates.splice(index, 1);

    // Emit notification
    emitNotification(
      'candidate_deleted',
      '🗑️ Candidate Deleted',
      `Candidate "${candidate.firstName}" has been removed.`,
      { candidateName: candidate.firstName, candidateId: req.params.id }
    );

    res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
