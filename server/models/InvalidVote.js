const mongoose = require('mongoose');

/**
 * Invalid Vote Schema
 * 
 * This schema tracks votes that were invalidated due to security violations
 * during the voting process.
 */
const invalidVoteSchema = new mongoose.Schema({
  voterId: {
    type: String,
    required: true
  },
  candidateId: {
    type: String,
    required: true
  },
  violationType: {
    type: String,
    enum: ['multiple_faces', 'multiple_voices', 'fraud_detection', 'other'],
    required: true
  },
  violationDetails: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  evidenceData: {
    type: String, // Could store a reference to evidence files (images, audio, etc.)
    default: null
  }
});

const InvalidVote = mongoose.model('InvalidVote', invalidVoteSchema);

module.exports = InvalidVote;
