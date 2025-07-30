/**
 * Multiple Person Detection Module
 *
 * This module detects if multiple people are present during the voting process,
 * which could indicate potential fraud or coercion. It also includes enhanced
 * fraud detection capabilities to analyze video for suspicious patterns.
 */

const faceRecognition = require('./faceRecognition');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

// Store historical detection data for fraud analysis
const detectionHistory = {
  recentDetections: [],
  suspiciousPatterns: 0,
  lastAnalysisTime: 0
};

/**
 * Detect multiple people in a single frame
 * @param {Buffer} imageBuffer - The image buffer to analyze
 * @returns {Promise<Object>} - Detection results
 */
async function detectMultiplePeopleInFrame(imageBuffer) {
  try {
    // Use the face recognition module to detect faces
    const detectionResult = await faceRecognition.detectMultiplePeople(imageBuffer);

    if (!detectionResult.success) {
      return detectionResult;
    }

    return {
      success: true,
      multiplePeopleDetected: detectionResult.multiplePeopleDetected,
      faceCount: detectionResult.faceCount,
      securityThreat: detectionResult.faceCount > 1
    };
  } catch (error) {
    console.error('Error detecting multiple people in frame:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Continuous monitoring for multiple people
 * This function would be used with a WebSocket connection to continuously
 * monitor the voter's environment during the voting process.
 * @param {function} frameCallback - Callback function that provides image frames
 * @param {function} resultCallback - Callback function to receive detection results
 * @param {Object} options - Configuration options
 */
async function monitorForMultiplePeople(frameCallback, resultCallback, options = {}) {
  const defaultOptions = {
    intervalMs: 1000, // Check every second
    maxDuration: 300000, // Monitor for 5 minutes max
    sensitivityThreshold: 0.8 // Confidence threshold
  };

  const config = { ...defaultOptions, ...options };
  let monitoring = true;
  let startTime = Date.now();

  // Start monitoring loop
  while (monitoring) {
    try {
      // Get current frame
      const currentFrame = await frameCallback();

      if (!currentFrame) {
        await new Promise(resolve => setTimeout(resolve, config.intervalMs));
        continue;
      }

      // Detect multiple people
      const detectionResult = await detectMultiplePeopleInFrame(currentFrame);

      // Send result to callback
      resultCallback(detectionResult);

      // Check if we should stop monitoring
      if (Date.now() - startTime > config.maxDuration) {
        monitoring = false;
      }

      // Wait for next interval
      await new Promise(resolve => setTimeout(resolve, config.intervalMs));
    } catch (error) {
      console.error('Error in monitoring loop:', error);
      resultCallback({
        success: false,
        error: error.message
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.intervalMs * 2));
    }
  }
}

/**
 * Analyze a sequence of frames to detect if people are entering or leaving
 * @param {Array<Buffer>} frameBuffers - Array of image buffers representing a sequence
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeFrameSequence(frameBuffers) {
  try {
    if (!Array.isArray(frameBuffers) || frameBuffers.length < 2) {
      return {
        success: false,
        error: 'At least two frames are required for sequence analysis'
      };
    }

    const results = [];
    let peopleCountChanged = false;
    let previousCount = 0;

    // Analyze each frame
    for (let i = 0; i < frameBuffers.length; i++) {
      const detectionResult = await detectMultiplePeopleInFrame(frameBuffers[i]);

      if (!detectionResult.success) {
        continue;
      }

      results.push({
        frameIndex: i,
        faceCount: detectionResult.faceCount
      });

      // Check if people count changed
      if (i > 0 && detectionResult.faceCount !== previousCount) {
        peopleCountChanged = true;
      }

      previousCount = detectionResult.faceCount;
    }

    return {
      success: true,
      frameResults: results,
      peopleCountChanged: peopleCountChanged,
      securityThreat: peopleCountChanged || results.some(r => r.faceCount > 1)
    };
  } catch (error) {
    console.error('Error analyzing frame sequence:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Detect potential fraud in video by analyzing patterns over time
 * @param {Buffer} currentFrameBuffer - Current video frame buffer
 * @returns {Promise<Object>} - Fraud detection results
 */
async function detectVideoFraud(currentFrameBuffer) {
  try {
    // Detect people in the current frame
    const currentDetection = await detectMultiplePeopleInFrame(currentFrameBuffer);

    if (!currentDetection.success) {
      return {
        success: false,
        error: currentDetection.error || 'Failed to analyze current frame'
      };
    }

    // Add to detection history (keep last 30 detections)
    detectionHistory.recentDetections.push({
      timestamp: Date.now(),
      faceCount: currentDetection.faceCount,
      multiplePeopleDetected: currentDetection.multiplePeopleDetected
    });

    // Limit history size
    if (detectionHistory.recentDetections.length > 30) {
      detectionHistory.recentDetections.shift();
    }

    // Only perform full analysis every 5 seconds to save resources
    const shouldAnalyze = Date.now() - detectionHistory.lastAnalysisTime > 5000;

    if (shouldAnalyze && detectionHistory.recentDetections.length >= 5) {
      detectionHistory.lastAnalysisTime = Date.now();

      // Analyze for suspicious patterns
      const fraudAnalysis = analyzeForFraudPatterns(detectionHistory.recentDetections);

      // Update suspicious pattern count
      if (fraudAnalysis.suspiciousPatternDetected) {
        detectionHistory.suspiciousPatterns++;
      } else {
        // Gradually decrease suspicion if no new patterns detected
        detectionHistory.suspiciousPatterns = Math.max(0, detectionHistory.suspiciousPatterns - 0.5);
      }

      return {
        success: true,
        currentFrameResult: currentDetection,
        fraudDetected: detectionHistory.suspiciousPatterns >= 3,
        suspiciousPatterns: detectionHistory.suspiciousPatterns,
        fraudConfidence: Math.min(1.0, detectionHistory.suspiciousPatterns / 5),
        fraudAnalysis: fraudAnalysis
      };
    }

    // Return simplified result if not performing full analysis
    return {
      success: true,
      currentFrameResult: currentDetection,
      fraudDetected: detectionHistory.suspiciousPatterns >= 3,
      suspiciousPatterns: detectionHistory.suspiciousPatterns,
      fraudConfidence: Math.min(1.0, detectionHistory.suspiciousPatterns / 5)
    };
  } catch (error) {
    console.error('Error detecting video fraud:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Analyze detection history for patterns that might indicate fraud
 * @param {Array<Object>} detections - Recent detection results
 * @returns {Object} - Analysis results
 */
function analyzeForFraudPatterns(detections) {
  // Pattern 1: Rapid changes in face count (could indicate someone hiding)
  let faceCountChanges = 0;
  for (let i = 1; i < detections.length; i++) {
    if (detections[i].faceCount !== detections[i-1].faceCount) {
      faceCountChanges++;
    }
  }

  // Pattern 2: Periodic disappearance of faces (could indicate someone hiding)
  let periodicDisappearances = 0;
  let noFaceCount = 0;
  for (let i = 0; i < detections.length; i++) {
    if (detections[i].faceCount === 0) {
      noFaceCount++;
    } else if (noFaceCount > 0) {
      // Face reappeared after disappearing
      periodicDisappearances++;
      noFaceCount = 0;
    }
  }

  // Pattern 3: Alternating face counts (could indicate taking turns)
  let alternatingPattern = false;
  if (detections.length >= 6) {
    const pattern = [];
    for (let i = 0; i < 6; i++) {
      pattern.push(detections[detections.length - 6 + i].faceCount);
    }

    // Check for patterns like [1,0,1,0,1,0] or [1,2,1,2,1,2]
    let alternating = true;
    for (let i = 0; i < 4; i += 2) {
      if (pattern[i] !== pattern[i+2] || pattern[i+1] !== pattern[i+3]) {
        alternating = false;
        break;
      }
    }

    alternatingPattern = alternating && pattern[0] !== pattern[1];
  }

  // Calculate suspicion score
  const rapidChangeThreshold = detections.length * 0.3; // 30% of frames show changes
  const suspiciousScore =
    (faceCountChanges > rapidChangeThreshold ? 1 : 0) +
    (periodicDisappearances >= 2 ? 1 : 0) +
    (alternatingPattern ? 1 : 0);

  return {
    suspiciousPatternDetected: suspiciousScore >= 1,
    suspiciousScore: suspiciousScore,
    patterns: {
      rapidFaceCountChanges: faceCountChanges > rapidChangeThreshold,
      periodicDisappearances: periodicDisappearances >= 2,
      alternatingPattern: alternatingPattern
    }
  };
}

module.exports = {
  detectMultiplePeopleInFrame,
  monitorForMultiplePeople,
  analyzeFrameSequence,
  detectVideoFraud
};
