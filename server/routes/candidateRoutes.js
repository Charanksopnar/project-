const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const upload = require('../middleware/upload');
const { adminAuth } = require('../middleware/auth');

// Create a new candidate
router.post('/createCandidate', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'symbol', maxCount: 1 }
]), async (req, res) => {
  try {
    const { firstName, age, party, bio } = req.body;
    
    // Create new candidate
    const newCandidate = new Candidate({
      firstName,
      age: parseInt(age),
      party,
      bio,
      image: req.files.image ? req.files.image[0].filename : 'default-candidate.jpg',
      symbol: req.files.symbol ? req.files.symbol[0].filename : 'default-symbol.jpg'
    });
    
    await newCandidate.save();
    
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
    const candidates = await Candidate.find();
    
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
    const candidate = await Candidate.findById(req.params.id);
    
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
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Candidate not found' 
      });
    }
    
    // Increment votes
    candidate.votes += 1;
    await candidate.save();
    
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
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Candidate not found' 
      });
    }
    
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
