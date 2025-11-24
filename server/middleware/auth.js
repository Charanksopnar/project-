const jwt = require('jsonwebtoken');
const mockDb = require('../mockDb');

// Middleware to authenticate voters
exports.voterAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const voter = mockDb.voters.find(v => v._id === decoded.id || v._id.toString() === decoded.id.toString());

    if (!voter) {
      return res.status(401).json({ success: false, message: 'Invalid authentication' });
    }

    req.voter = voter;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// Middleware to authenticate admins
exports.adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

    const admin = mockDb.admins.find(a => a._id === decoded.id || a._id.toString() === decoded.id.toString());

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid authentication' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};
