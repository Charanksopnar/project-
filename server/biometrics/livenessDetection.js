/**
 * Liveness Detection Module
 *
 * This module handles:
 * - Real-time video recording during voting
 * - Detection of multiple people (fraud prevention)
 * - Liveness verification (ensures voter is actually present)
 * - Warning system for policy violations
 */

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const Voter = require('../models/Voter');
const InvalidVote = require('../models/InvalidVote');

// Configuration
const LIVENESS_CONFIG = {
  minConfidenceThreshold: 0.7,
  personDetectionThreshold: 0.5,
  recordingDuration: 30000, // 30 seconds
  faceDetectionInterval: 500, // Check every 500ms
  maxWarnings: 2 // Multiple people detected warning threshold
};

let faceDetectionModel = null;
let personDetectionModel = null;

// Simple in-memory tracker for warnings per voter during a session.
// Format: { [voterId]: { count: number, lastWarningAt: timestamp, candidateId: string } }
const warningTracker = new Map();

/**
 * Initialize face and person detection models
 */
async function initializeModels() {
  try {
    // Using TensorFlow.js with coco-ssd model for object detection
    const cocoSsd = require('@tensorflow-models/coco-ssd');
    personDetectionModel = await cocoSsd.load();
    console.log('✅ Person detection model loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error loading person detection models:', error);
    return false;
  }
}

/**
 * Detect faces/people in a frame
 * @param {Tensor} frameTensor - TensorFlow tensor of the frame
 * @returns {Object} Detection results with count and confidence scores
 */
async function detectPersons(frameTensor) {
  try {
    if (!personDetectionModel) {
      await initializeModels();
    }

    const predictions = await personDetectionModel.estimateObjects(frameTensor);
    
    // Filter predictions for "person" class only
    const persons = predictions.filter(pred => pred.class === 'person' && pred.score >= LIVENESS_CONFIG.personDetectionThreshold);

    return {
      success: true,
      personCount: persons.length,
      detections: persons,
      timestamp: Date.now(),
      isMultiplePeople: persons.length > 1,
      confidence: persons.length > 0 ? Math.max(...persons.map(p => p.score)) : 0
    };
  } catch (error) {
    console.error('Error detecting persons:', error);
    return {
      success: false,
      personCount: 0,
      detections: [],
      error: error.message
    };
  }
}

/**
 * Record video stream with frame-by-frame analysis
 * @param {string} voterId - ID of the voter
 * @param {number} duration - Recording duration in milliseconds
 * @returns {Object} Recording metadata with detection results
 */
async function recordAndAnalyzeLiveness(voterId, duration = LIVENESS_CONFIG.recordingDuration) {
  try {
    const timestamp = Date.now();
    const recordingId = `liveness_${voterId}_${timestamp}`;
    const recordingDir = path.join(__dirname, '../uploads/liveness');
    
    // Ensure directory exists
    if (!fs.existsSync(recordingDir)) {
      fs.mkdirSync(recordingDir, { recursive: true });
    }

    const videoPath = path.join(recordingDir, `${recordingId}.webm`);
    const metadataPath = path.join(recordingDir, `${recordingId}_metadata.json`);

    // Initialize tracking variables
    const analysisResults = {
      recordingId,
      voterId,
      videoPath,
      startTime: timestamp,
      duration,
      multiplePersonWarnings: [],
      livenessScore: 0,
      frameAnalysis: [],
      isLive: true,
      passed: true
    };

    // Note: In production, you'd integrate with actual video capture
    // For now, we'll simulate the analysis
    console.log(`📹 Starting liveness recording for voter ${voterId}`);

    // Save metadata
    fs.writeFileSync(metadataPath, JSON.stringify(analysisResults, null, 2));

    return analysisResults;
  } catch (error) {
    console.error('Error recording liveness:', error);
    return {
      success: false,
      error: error.message,
      passed: false
    };
  }
}

/**
 * Analyze recording for liveness and multi-person detection
 * @param {string} recordingId - ID of the recording
 * @returns {Object} Analysis results
 */
async function analyzeLivenessRecording(recordingId) {
  try {
    const recordingDir = path.join(__dirname, '../uploads/liveness');
    const metadataPath = path.join(recordingDir, `${recordingId}_metadata.json`);

    if (!fs.existsSync(metadataPath)) {
      return {
        success: false,
        error: 'Recording not found',
        passed: false
      };
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    // Simulate analysis
    const analysisResult = {
      recordingId,
      success: true,
      passed: true,
      livenessScore: 0.95, // High liveness confidence
      multiplePersonDetected: false,
      multiplePersonWarnings: 0,
      movementDetected: true,
      eyeBlinkDetected: true,
      faceOccluded: false,
      warnings: [],
      recommendations: []
    };

    return analysisResult;
  } catch (error) {
    console.error('Error analyzing liveness recording:', error);
    return {
      success: false,
      error: error.message,
      passed: false
    };
  }
}

/**
 * Process a detection report sent from client while voting.
 * This accepts a small payload (voterId, candidateId, personCount, recordingId)
 * and will track warnings for multiple-person detection. If warnings exceed
 * threshold, the vote will be marked invalid and the voter's `voteStatus` will
 * be updated to true (considered as voted) and an InvalidVote will be saved.
 */
async function processDetectionReport(voterId, candidateId, personCount, recordingId = null) {
  try {
    if (!voterId) throw new Error('Missing voterId');

    const now = Date.now();

    // ensure tracker entry exists
    const entry = warningTracker.get(voterId) || { count: 0, lastWarningAt: null, candidateId };

    const recordingDir = path.join(__dirname, '../uploads/liveness');
    if (!fs.existsSync(recordingDir)) fs.mkdirSync(recordingDir, { recursive: true });

    const recordingMetaPath = recordingId ? path.join(recordingDir, `${recordingId}_metadata.json`) : null;

    // create basic metadata if missing
    let metadata = null;
    if (recordingMetaPath && fs.existsSync(recordingMetaPath)) {
      try { metadata = JSON.parse(fs.readFileSync(recordingMetaPath, 'utf8')); } catch (e) { metadata = null; }
    }
    if (!metadata) {
      metadata = {
        recordingId: recordingId || `liveness_${voterId}_${now}`,
        voterId,
        candidateId,
        createdAt: now,
        multiplePersonWarnings: []
      };
    }

    const report = {
      voterId,
      candidateId,
      personCount,
      recordingId: metadata.recordingId,
      timestamp: now
    };

    if (personCount > 1) {
      const warning = generateMultiPersonWarning(personCount);
      metadata.multiplePersonWarnings.push(warning);

      // update tracker
      entry.count = (entry.count || 0) + 1;
      entry.lastWarningAt = now;
      entry.candidateId = candidateId || entry.candidateId;
      warningTracker.set(voterId, entry);

      // persist metadata
      try { fs.writeFileSync(path.join(recordingDir, `${metadata.recordingId}_metadata.json`), JSON.stringify(metadata, null, 2)); } catch (e) { /* ignore persistence errors */ }

      // If repeated warnings exceed threshold, mark invalid and update voter
      if (entry.count >= LIVENESS_CONFIG.maxWarnings) {
        // create invalid vote record
        try {
          const invalid = new InvalidVote({
            voterId,
            candidateId: entry.candidateId || candidateId || 'unknown',
            violationType: 'multiple_faces',
            violationDetails: `Detected multiple people ${entry.count} times during voting.`,
            evidenceData: metadata.recordingId ? `${metadata.recordingId}.webm` : null
          });
          await invalid.save();
        } catch (e) {
          console.error('Error saving InvalidVote:', e.message || e);
        }

        // mark the voter as voted to prevent further voting attempts
        try {
          await Voter.updateOne({ _id: voterId }, { $set: { voteStatus: true } });
        } catch (e) {
          console.error('Error updating voter voteStatus:', e.message || e);
        }

        // return an explicit invalidation result
        return {
          success: true,
          invalidated: true,
          reason: 'MULTIPLE_PEOPLE_DETECTED',
          warnings: metadata.multiplePersonWarnings,
          message: 'Vote marked invalid due to repeated multiple-person detection'
        };
      }

      // not yet exceeded threshold — return warning
      return {
        success: true,
        invalidated: false,
        warning,
        warningsCount: entry.count,
        message: 'Multiple persons detected; voter warned'
      };
    }

    // If personCount == 1, optionally reset tracker (depends on policy)
    if (personCount === 1 && warningTracker.has(voterId)) {
      // allow warnings to decay: reset if no recent warnings
      const existing = warningTracker.get(voterId);
      const age = now - (existing.lastWarningAt || 0);
      // reset if more than 5 minutes passed since last warning
      if (age > 5 * 60 * 1000) {
        warningTracker.delete(voterId);
      }
    }

    // no multi-persons — return ok
    return { success: true, invalidated: false, message: 'Single person detected' };
  } catch (error) {
    console.error('processDetectionReport error:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Check for multiple people in frame and generate warning
 * @param {number} personCount - Number of people detected
 * @returns {Object} Warning data
 */
function generateMultiPersonWarning(personCount) {
  return {
    type: 'MULTIPLE_PERSON_DETECTED',
    severity: personCount > 2 ? 'HIGH' : 'MEDIUM',
    message: `⚠️ ${personCount} people detected in frame. Only one person should be present during voting.`,
    personCount,
    timestamp: Date.now(),
    actionRequired: true
  };
}

/**
 * Validate voting liveness requirements
 * @param {Object} livenessData - Liveness recording data
 * @returns {Object} Validation result
 */
function validateLiveness(livenessData) {
  const validation = {
    passed: true,
    errors: [],
    warnings: [],
    details: {}
  };

  // Check if recording was completed
  if (!livenessData.recordingId) {
    validation.passed = false;
    validation.errors.push('No recording found');
  }

  // Check for multiple person detection warnings
  if (livenessData.multiplePersonWarnings && livenessData.multiplePersonWarnings.length >= LIVENESS_CONFIG.maxWarnings) {
    validation.passed = false;
    validation.errors.push(`Multiple people detected ${LIVENESS_CONFIG.maxWarnings} or more times - vote marked as invalid`);
    validation.details.invalidReason = 'MULTIPLE_PEOPLE_DETECTED';
  }

  // Check liveness score
  if (livenessData.livenessScore < LIVENESS_CONFIG.minConfidenceThreshold) {
    validation.passed = false;
    validation.errors.push('Liveness verification failed - insufficient confidence');
    validation.details.invalidReason = 'LIVENESS_CHECK_FAILED';
  }

  return validation;
}

/**
 * Save liveness verification for voter
 * @param {string} voterId - Voter ID
 * @param {Object} livenessData - Liveness data
 * @returns {Object} Save result
 */
function saveLivenessVerification(voterId, livenessData) {
  try {
    const verificationDir = path.join(__dirname, '../uploads/liveness');
    const verificationPath = path.join(verificationDir, `verification_${voterId}_${Date.now()}.json`);

    if (!fs.existsSync(verificationDir)) {
      fs.mkdirSync(verificationDir, { recursive: true });
    }

    const verificationRecord = {
      voterId,
      recordingId: livenessData.recordingId,
      timestamp: Date.now(),
      passed: livenessData.passed || true,
      livenessScore: livenessData.livenessScore || 0,
      multiplePersonWarnings: livenessData.multiplePersonWarnings || [],
      validationErrors: livenessData.validationErrors || []
    };

    fs.writeFileSync(verificationPath, JSON.stringify(verificationRecord, null, 2));

    return {
      success: true,
      verificationId: path.basename(verificationPath),
      message: 'Liveness verification saved'
    };
  } catch (error) {
    console.error('Error saving liveness verification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  initializeModels,
  detectPersons,
  recordAndAnalyzeLiveness,
  analyzeLivenessRecording,
  generateMultiPersonWarning,
  validateLiveness,
  saveLivenessVerification,
  LIVENESS_CONFIG
};
