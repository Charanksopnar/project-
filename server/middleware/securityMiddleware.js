/**
 * Security Middleware Module
 * 
 * This module provides security middleware for the voting system,
 * including biometric verification, fraud detection, and error handling.
 */

const faceRecognition = require('../biometrics/faceRecognition');
const idVerification = require('../biometrics/idVerification');
const multiplePersonDetection = require('../biometrics/multiplePersonDetection');
const voiceDetection = require('../biometrics/voiceDetection');
const fraudDetection = require('../ai/fraudDetection');
const errorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Middleware to verify face before voting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function verifyFace(req, res, next) {
  try {
    // Check if face image is provided
    if (!req.files || !req.files.faceImage) {
      throw new errorHandler.ValidationError('Face image is required for verification');
    }
    
    // Get the face image buffer
    const faceImageBuffer = req.files.faceImage.data;
    
    // Get the stored face image for this user
    // In a real implementation, this would come from a database
    // For this example, we'll assume it's provided in the request
    const storedFaceImageBuffer = req.files.storedFaceImage ? req.files.storedFaceImage.data : null;
    
    if (!storedFaceImageBuffer) {
      throw new errorHandler.ValidationError('Stored face image not found for this user');
    }
    
    // Compare the faces
    const comparisonResult = await faceRecognition.compareFaces(faceImageBuffer, storedFaceImageBuffer);
    
    if (!comparisonResult.success) {
      throw new errorHandler.BiometricVerificationError('Face comparison failed', {
        biometricType: 'face',
        error: comparisonResult.error,
        retryAllowed: true
      });
    }
    
    if (!comparisonResult.isMatch) {
      throw new errorHandler.BiometricVerificationError('Face does not match the registered user', {
        biometricType: 'face',
        confidence: comparisonResult.confidence,
        retryAllowed: true
      });
    }
    
    // Log successful verification
    logger.biometric('Face verification successful', {
      userId: req.user ? req.user.id : 'unknown',
      confidence: comparisonResult.confidence
    });
    
    // Add verification result to request
    req.faceVerification = {
      verified: true,
      confidence: comparisonResult.confidence
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to verify ID before voting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function verifyID(req, res, next) {
  try {
    // Check if ID image is provided
    if (!req.files || !req.files.idImage) {
      throw new errorHandler.ValidationError('ID image is required for verification');
    }
    
    // Get the ID image buffer
    const idImageBuffer = req.files.idImage.data;
    
    // Get the ID type
    const idType = req.body.idType;
    
    if (!idType) {
      throw new errorHandler.ValidationError('ID type is required');
    }
    
    // Verify the ID based on type
    let verificationResult;

    switch (idType.toLowerCase()) {
      case 'aadhar':
        verificationResult = await idVerification.verifyAadharCard(idImageBuffer);
        break;
      case 'voter':
        verificationResult = await idVerification.verifyVoterID(idImageBuffer);
        break;
      default:
        throw new errorHandler.ValidationError('Unsupported ID type');
    }
    
    if (!verificationResult.success) {
      throw new errorHandler.BiometricVerificationError('ID verification failed', {
        biometricType: 'id',
        idType: idType,
        error: verificationResult.error,
        retryAllowed: true
      });
    }
    
    if (!verificationResult.isValid) {
      throw new errorHandler.BiometricVerificationError('Invalid ID document', {
        biometricType: 'id',
        idType: idType,
        retryAllowed: true
      });
    }
    
    // If face image is provided, match face on ID with user's face
    if (req.files.faceImage) {
      const faceMatchResult = await idVerification.matchFaceWithID(
        idImageBuffer,
        req.files.faceImage.data
      );
      
      if (!faceMatchResult.success || !faceMatchResult.isMatch) {
        throw new errorHandler.BiometricVerificationError('Face on ID does not match user', {
          biometricType: 'id-face-match',
          confidence: faceMatchResult.confidence,
          retryAllowed: true
        });
      }
    }
    
    // Log successful verification
    logger.biometric('ID verification successful', {
      userId: req.user ? req.user.id : 'unknown',
      idType: idType,
      idNumber: verificationResult.idNumber
    });
    
    // Add verification result to request
    req.idVerification = {
      verified: true,
      idType: idType,
      idNumber: verificationResult.idNumber
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to detect multiple people during voting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function detectMultiplePeople(req, res, next) {
  try {
    // Check if face image is provided
    if (!req.files || !req.files.faceImage) {
      throw new errorHandler.ValidationError('Face image is required for multiple person detection');
    }
    
    // Get the face image buffer
    const faceImageBuffer = req.files.faceImage.data;
    
    // Detect multiple people
    const detectionResult = await multiplePersonDetection.detectMultiplePeopleInFrame(faceImageBuffer);
    
    if (!detectionResult.success) {
      throw new errorHandler.BiometricVerificationError('Multiple person detection failed', {
        biometricType: 'multiple-person',
        error: detectionResult.error,
        retryAllowed: true
      });
    }
    
    if (detectionResult.multiplePeopleDetected) {
      // Log security event
      logger.security('Multiple people detected during voting', {
        userId: req.user ? req.user.id : 'unknown',
        faceCount: detectionResult.faceCount
      });
      
      throw new errorHandler.FraudDetectionError('Multiple people detected in the voting environment', {
        fraudType: 'multiple-people',
        faceCount: detectionResult.faceCount,
        riskLevel: 'high',
        actionRequired: 'verify'
      });
    }
    
    // Add detection result to request
    req.multiplePersonDetection = {
      multiplePeopleDetected: false,
      faceCount: detectionResult.faceCount
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to detect multiple voices during voting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function detectMultipleVoices(req, res, next) {
  try {
    // Check if audio is provided
    if (!req.files || !req.files.audio) {
      // Voice detection is optional, so just continue
      req.multipleVoiceDetection = {
        performed: false
      };
      return next();
    }
    
    // Get the audio buffer
    const audioBuffer = req.files.audio.data;
    
    // Detect multiple voices
    const detectionResult = await voiceDetection.detectMultipleVoices(audioBuffer);
    
    if (!detectionResult.success) {
      // Log the error but continue (non-critical)
      logger.warn('Multiple voice detection failed', {
        userId: req.user ? req.user.id : 'unknown',
        error: detectionResult.error
      });
      
      req.multipleVoiceDetection = {
        performed: true,
        success: false,
        error: detectionResult.error
      };
      
      return next();
    }
    
    if (detectionResult.multipleVoicesDetected) {
      // Log security event
      logger.security('Multiple voices detected during voting', {
        userId: req.user ? req.user.id : 'unknown',
        confidence: detectionResult.confidence
      });
      
      throw new errorHandler.FraudDetectionError('Multiple voices detected in the voting environment', {
        fraudType: 'multiple-voices',
        confidence: detectionResult.confidence,
        riskLevel: 'medium',
        actionRequired: 'verify'
      });
    }
    
    // Add detection result to request
    req.multipleVoiceDetection = {
      performed: true,
      success: true,
      multipleVoicesDetected: false,
      confidence: detectionResult.confidence
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to detect potential fraud
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function detectFraud(req, res, next) {
  try {
    // Prepare vote data for fraud check
    const voteData = {
      faceImage: req.files && req.files.faceImage ? req.files.faceImage.data : null,
      userData: {
        userId: req.user ? req.user.id : 'unknown',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceId: req.body.deviceId || 'unknown'
      },
      recentActivities: req.recentActivities || [],
      userActions: req.userActions || []
    };
    
    // Perform comprehensive fraud check
    const fraudCheckResult = await fraudDetection.comprehensiveFraudCheck(voteData);
    
    if (!fraudCheckResult.success) {
      // Log the error but continue (with warning)
      logger.warn('Fraud detection failed', {
        userId: req.user ? req.user.id : 'unknown',
        error: fraudCheckResult.error
      });
      
      req.fraudDetection = {
        performed: true,
        success: false,
        error: fraudCheckResult.error
      };
      
      return next();
    }
    
    if (fraudCheckResult.fraudDetected) {
      // Log fraud event
      logger.fraud('Potential fraud detected', {
        userId: req.user ? req.user.id : 'unknown',
        fraudProbability: fraudCheckResult.fraudProbability,
        riskLevel: fraudCheckResult.riskLevel,
        details: fraudCheckResult.details
      });
      
      // For high and critical risk levels, block the vote
      if (['high', 'critical'].includes(fraudCheckResult.riskLevel)) {
        throw new errorHandler.FraudDetectionError('Potential fraud detected', {
          fraudType: 'comprehensive',
          fraudProbability: fraudCheckResult.fraudProbability,
          riskLevel: fraudCheckResult.riskLevel,
          actionRequired: 'block'
        });
      }
      
      // For medium risk, add a warning but allow the vote to proceed
      req.fraudWarning = {
        message: 'Suspicious activity detected',
        riskLevel: fraudCheckResult.riskLevel,
        details: 'Your voting activity has been flagged for review'
      };
    }
    
    // Add fraud detection result to request
    req.fraudDetection = {
      performed: true,
      success: true,
      fraudDetected: fraudCheckResult.fraudDetected,
      fraudProbability: fraudCheckResult.fraudProbability,
      riskLevel: fraudCheckResult.riskLevel
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  verifyFace,
  verifyID,
  detectMultiplePeople,
  detectMultipleVoices,
  detectFraud
};
