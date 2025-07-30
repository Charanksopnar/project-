// Face detection utilities for the Online Voting System

/**
 * Face Detection Manager class for handling face detection operations
 */
export class FaceDetectionManager {
  constructor() {
    this.detectionHistory = [];
    this.maxHistorySize = 100;
    this.fraudThreshold = 0.7;
    this.modelsLoaded = false;
  }

  /**
   * Load face-api.js models
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<boolean>} - Whether models loaded successfully
   */
  async loadModels(maxRetries = 3) {
    if (this.modelsLoaded) {
      console.log('Face detection models already loaded');
      return true;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Loading face detection models (attempt ${attempt}/${maxRetries})...`);

        // Check if face-api is available
        if (typeof window !== 'undefined' && window.faceapi) {
          const faceapi = window.faceapi;

          // Load models from public directory
          const MODEL_URL = '/models';

          await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
          ]);

          this.modelsLoaded = true;
          console.log('Face detection models loaded successfully');
          return true;
        } else {
          throw new Error('face-api.js not available');
        }
      } catch (error) {
        console.error(`Error loading face detection models (attempt ${attempt}):`, error);

        if (attempt === maxRetries) {
          console.warn('Failed to load face detection models after all attempts. Using mock detection.');
          this.modelsLoaded = false;
          return false;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return false;
  }

  /**
   * Process face detection results and analyze for fraud patterns
   */
  processFaceDetectionHistory(detectionResult) {
    // Add current detection to history
    this.detectionHistory.push({
      timestamp: Date.now(),
      ...detectionResult
    });

    // Keep history within limits
    if (this.detectionHistory.length > this.maxHistorySize) {
      this.detectionHistory.shift();
    }

    // Analyze for fraud patterns
    const analysis = this.analyzeFraudPatterns();

    return {
      analysis,
      historySize: this.detectionHistory.length
    };
  }

  /**
   * Analyze detection history for fraud patterns
   */
  analyzeFraudPatterns() {
    if (this.detectionHistory.length < 10) {
      return {
        fraudDetected: false,
        confidence: 0,
        patterns: []
      };
    }

    const recentHistory = this.detectionHistory.slice(-20);
    const patterns = [];
    let fraudScore = 0;

    // Check for rapid face count changes
    const faceCountChanges = this.detectRapidFaceCountChanges(recentHistory);
    if (faceCountChanges.detected) {
      patterns.push('rapid_face_count_changes');
      fraudScore += 0.3;
    }

    // Check for suspicious timing patterns
    const timingPatterns = this.detectSuspiciousTimingPatterns(recentHistory);
    if (timingPatterns.detected) {
      patterns.push('suspicious_timing');
      fraudScore += 0.2;
    }

    // Check for multiple face occurrences
    const multipleFacePattern = this.detectMultipleFacePattern(recentHistory);
    if (multipleFacePattern.detected) {
      patterns.push('multiple_faces');
      fraudScore += 0.4;
    }

    return {
      fraudDetected: fraudScore >= this.fraudThreshold,
      confidence: Math.min(fraudScore, 1.0),
      patterns
    };
  }

  /**
   * Detect rapid changes in face count
   */
  detectRapidFaceCountChanges(history) {
    let rapidChanges = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      
      if (Math.abs((curr.faceCount || 0) - (prev.faceCount || 0)) > 1) {
        rapidChanges++;
      }
    }

    return {
      detected: rapidChanges > history.length * 0.3,
      count: rapidChanges
    };
  }

  /**
   * Detect suspicious timing patterns
   */
  detectSuspiciousTimingPatterns(history) {
    const intervals = [];
    for (let i = 1; i < history.length; i++) {
      intervals.push(history[i].timestamp - history[i - 1].timestamp);
    }

    // Check for too regular intervals (might indicate automation)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2);
    }, 0) / intervals.length;

    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / avgInterval;

    return {
      detected: coefficientOfVariation < 0.1, // Too regular
      variance: coefficientOfVariation
    };
  }

  /**
   * Detect patterns of multiple faces
   */
  detectMultipleFacePattern(history) {
    const multipleFaceCount = history.filter(h => h.multipleFaces).length;
    const ratio = multipleFaceCount / history.length;

    return {
      detected: ratio > 0.2, // More than 20% of frames have multiple faces
      ratio
    };
  }

  /**
   * Clear detection history
   */
  clearHistory() {
    this.detectionHistory = [];
  }

  /**
   * Get current fraud score
   */
  getCurrentFraudScore() {
    if (this.detectionHistory.length === 0) return 0;
    return this.analyzeFraudPatterns().confidence;
  }
}

/**
 * Utility function to detect faces in video stream
 */
export const detectFacesInStream = async (videoElement, options = {}) => {
  const {
    inputSize = 320,
    scoreThreshold = 0.5
  } = options;

  try {
    // Check if video element is valid
    if (!videoElement || videoElement.readyState !== 4) {
      throw new Error('Video element not ready');
    }

    // Try to use face-api.js if available and models are loaded
    if (typeof window !== 'undefined' && window.faceapi && faceDetectionManager.modelsLoaded) {
      const faceapi = window.faceapi;

      // Create detection options
      const detectionOptions = new faceapi.SsdMobilenetv1Options({
        inputSize,
        scoreThreshold
      });

      // Detect faces in the video element
      const detections = await faceapi.detectAllFaces(videoElement, detectionOptions)
        .withFaceLandmarks()
        .withFaceExpressions();

      const faceCount = detections.length;
      const multipleFaces = faceCount > 1;
      const noFace = faceCount === 0;

      return {
        success: true,
        detections: detections.map(detection => ({
          box: detection.detection.box,
          score: detection.detection.score,
          landmarks: detection.landmarks,
          expressions: detection.expressions
        })),
        faceCount,
        multipleFaces,
        noFace
      };
    } else {
      // Fallback to mock detection when face-api.js is not available
      console.warn('Face-api.js not available or models not loaded, using mock detection');

      const mockDetection = {
        success: true,
        detections: [
          {
            box: { x: 100, y: 100, width: 200, height: 200 },
            score: 0.9
          }
        ],
        faceCount: 1,
        multipleFaces: false,
        noFace: false
      };

      return mockDetection;
    }
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      success: false,
      error: error.message,
      detections: [],
      faceCount: 0,
      multipleFaces: false,
      noFace: true
    };
  }
};

/**
 * Process face detection history for fraud analysis
 */
export const processFaceDetectionHistory = (faceDetected, multipleFaces, faceCount) => {
  // Initialize video frame history if it doesn't exist
  window.videoFrameHistory = window.videoFrameHistory || {
    frames: [],
    faceCountHistory: [],
    suspiciousPatterns: 0,
    lastAnalysisTime: 0
  };

  const currentTime = Date.now();
  const history = window.videoFrameHistory;

  // Add current frame data
  history.frames.push({
    timestamp: currentTime,
    faceDetected,
    multipleFaces,
    faceCount
  });

  history.faceCountHistory.push(faceCount);

  // Keep only recent history (last 50 frames)
  if (history.frames.length > 50) {
    history.frames.shift();
    history.faceCountHistory.shift();
  }

  // Analyze for suspicious patterns every 5 seconds
  if (currentTime - history.lastAnalysisTime > 5000) {
    history.lastAnalysisTime = currentTime;
    
    // Check for rapid face count changes
    const rapidChanges = history.faceCountHistory.filter((count, index) => {
      if (index === 0) return false;
      return Math.abs(count - history.faceCountHistory[index - 1]) > 1;
    }).length;

    if (rapidChanges > history.faceCountHistory.length * 0.3) {
      history.suspiciousPatterns++;
    }
  }

  return {
    analysis: {
      fraudDetected: history.suspiciousPatterns > 3,
      suspiciousPatterns: history.suspiciousPatterns,
      frameCount: history.frames.length
    }
  };
};

// Create a default instance for easy use
export const faceDetectionManager = new FaceDetectionManager();

// Export detectFacesInVideo as an alias for detectFacesInStream
export const detectFacesInVideo = detectFacesInStream;

const faceDetectionUtils = {
  FaceDetectionManager,
  faceDetectionManager,
  detectFacesInStream,
  detectFacesInVideo,
  processFaceDetectionHistory
};

export default faceDetectionUtils;
