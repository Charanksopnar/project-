const express = require('express');
const router = express.Router();
const Voter = require('../models/Voter');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');
const { voterAuth } = require('../middleware/auth');
const path = require('path');

// Register a new voter
router.post('/createVoter', upload.fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'profilePic', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, username, email, pass, dob, age, address, phone } = req.body;
    
    // Check if voter already exists
    const existingVoter = await Voter.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingVoter) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email or username' 
      });
    }
    
    // Create new voter
    const newVoter = new Voter({
      name,
      username,
      email,
      password: pass,
      dob: new Date(dob),
      age: parseInt(age),
      address,
      phone,
      idProof: req.files.idProof ? req.files.idProof[0].filename : 'default-id.jpg',
      profilePic: req.files.profilePic ? req.files.profilePic[0].filename : 'default-profile.jpg'
    });
    
    await newVoter.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Voter registered successfully' 
    });
  } catch (error) {
    console.error('Error registering voter:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Login voter
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find voter by username or email
    const voter = await Voter.findOne({ 
      $or: [{ username }, { email: username }] 
    });
    
    if (!voter) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isMatch = await voter.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: voter._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
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
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get voter profile
router.get('/voter/:id', voterAuth, async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id).select('-password');
    
    if (!voter) {
      return res.status(404).json({ 
        success: false, 
        message: 'Voter not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      voter
    });
  } catch (error) {
    console.error('Error getting voter profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update voter profile
router.patch('/updateVoter/:id', voterAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow updating certain fields
    delete updates.password;
    delete updates.email;
    delete updates.username;
    
    const voter = await Voter.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!voter) {
      return res.status(404).json({ 
        success: false, 
        message: 'Voter not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      voter
    });
  } catch (error) {
    console.error('Error updating voter:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all voters (admin only)
router.get('/getVoters', async (req, res) => {
  try {
    const voters = await Voter.find().select('-password');
    
    res.status(200).json({
      success: true,
      voters
    });
  } catch (error) {
    console.error('Error getting voters:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
