const express = require('express');
const router = express.Router();
const mockDb = require('../mockDb');
const jwt = require('jsonwebtoken');
const { adminAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// Admin login
router.post('/adminlogin', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = mockDb.admins.find(a => a.username === username);

    console.log('Admin login attempt for username:', username);
    if (admin) console.log('Found admin entry:', { _id: admin._id, username: admin.username });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    // In a real app, use bcrypt.compare
    // const isMatch = await bcrypt.compare(password, admin.password);
    // For mockDb, we might have plain text or hashed. 
    // Assuming hashed for security even in mock, but if we can't verify, we might need a workaround.
    // Let's assume the mock admin created in server.js has a known password or hash.
    // For now, if it's the default admin, we know the password.

    // Check password
    // In a real app, use bcrypt.compare
    // const isMatch = await bcrypt.compare(password, admin.password);
    // For mockDb, we might have plain text or hashed. 
    // Assuming hashed for security even in mock, but if we can't verify, we might need a workaround.
    // Let's assume the mock admin created in server.js has a known password or hash.
    // For now, if it's the default admin, we know the password.

    // Simple check for now or use bcrypt if we have it
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, admin.password);
    } catch (err) {
      logger.warn('bcrypt.compare failed, falling back to plain-text comparison: ' + (err && err.message));
      // fallback to plain equality (for legacy or incorrectly-stored passwords)
      isMatch = (admin.password === password);
    }

    logger.info('Password match result for admin ' + username + ': ' + isMatch);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      admin: {
        _id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Change admin password (admin only)
router.patch('/changePassword', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin._id; // adminAuth middleware should attach admin object

    const admin = mockDb.admins.find(a => a._id === adminId || a._id.toString() === adminId.toString());

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    // Persist changes would be needed here if we want it to survive restart
    // persistDataFile('admins.json', mockDb.admins); 

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
