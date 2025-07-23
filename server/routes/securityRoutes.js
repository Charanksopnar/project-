/**
 * Security Routes Module
 * 
 * This module defines the routes for security-related features,
 * including biometric verification, fraud detection, and security settings.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import security middleware
const securityMiddleware = require('../middleware/securityMiddleware');
const errorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Import biometric modules
const faceRecognition = require('../biometrics/faceRecognition');
const idVerification = require('../biometrics/idVerification');
const multiplePersonDetection = require('../biometrics/multiplePersonDetection');
const voiceDetection = require('../biometrics/voiceDetection');

// Import fraud detection module
const fraudDetection = require('../ai/fraudDetection');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * @route POST /api/security/verify-face
 * @desc Verify a user's face
 * @access Private
 */
router.post(
  '/verify-face',
  upload.single('faceImage'),
  errorHandler.catchAsync(async (req, res) => {
    if (!req.file) {
      throw new errorHandler.ValidationError('Face image is required');
    }
    
    // Get the face image path
    const faceImagePath = req.file.path;
    
    // Get the stored face image for this user
    // In a real implementation, this would come from a database
    // For this example, we'll use a mock path
    const storedFaceImagePath = path.join(__dirname, '../uploads/stored-faces', `user-${req.body.userId || 'unknown'}.jpg`);
    
    if (!fs.existsSync(storedFaceImagePath)) {
      throw new errorHandler.ValidationError('Stored face image not found for this user');
    }
    
    // Read the image files
    const faceImageBuffer = fs.readFileSync(faceImagePath);
    const storedFaceImageBuffer = fs.readFileSync(storedFaceImagePath);
    
    // Compare the faces
    const comparisonResult = await faceRecognition.compareFaces(faceImageBuffer, storedFaceImageBuffer);
    
    if (!comparisonResult.success) {
      throw new errorHandler.BiometricVerificationError('Face comparison failed', {
        biometricType: 'face',
        error: comparisonResult.error
      });
    }
    
    // Log the verification attempt
    logger.biometric('Face verification attempt', {
      userId: req.body.userId || 'unknown',
      isMatch: comparisonResult.isMatch,
      confidence: comparisonResult.confidence
    });
    
    // Return the result
    res.json({
      success: true,
      isMatch: comparisonResult.isMatch,
      confidence: comparisonResult.confidence,
      message: comparisonResult.isMatch ? 'Face verification successful' : 'Face does not match'
    });
  })
);

/**
 * @route POST /api/security/verify-id
 * @desc Verify a government ID
 * @access Private
 */
router.post(
  '/verify-id',
  upload.fields([
    { name: 'idImage', maxCount: 1 },
    { name: 'faceImage', maxCount: 1 }
  ]),
  errorHandler.catchAsync(async (req, res) => {
    if (!req.files || !req.files.idImage) {
      throw new errorHandler.ValidationError('ID image is required');
    }
    
    // Get the ID image path
    const idImagePath = req.files.idImage[0].path;
    
    // Get the ID type
    const idType = req.body.idType;
    
    if (!idType) {
      throw new errorHandler.ValidationError('ID type is required');
    }
    
    // Read the ID image file
    const idImageBuffer = fs.readFileSync(idImagePath);
    
    // Verify the ID based on type
    let verificationResult;
    
    switch (idType.toLowerCase()) {
      case 'aadhar':
        verificationResult = await idVerification.verifyAadharCard(idImageBuffer);
        break;
      case 'voter':
        verificationResult = await idVerification.verifyVoterID(idImageBuffer);
        break;
      case 'driving':
        verificationResult = await idVerification.verifyDrivingLicense(idImageBuffer);
        break;
      default:
        throw new errorHandler.ValidationError('Unsupported ID type');
    }
    
    // If face image is provided, match face on ID with user's face
    let faceMatchResult = { performed: false };
    
    if (req.files.faceImage) {
      const faceImagePath = req.files.faceImage[0].path;
      const faceImageBuffer = fs.readFileSync(faceImagePath);
      
      faceMatchResult = await idVerification.matchFaceWithID(idImageBuffer, faceImageBuffer);
      faceMatchResult.performed = true;
    }
    
    // Log the verification attempt
    logger.biometric('ID verification attempt', {
      userId: req.body.userId || 'unknown',
      idType: idType,
      isValid: verificationResult.isValid,
      faceMatchPerformed: faceMatchResult.performed,
      faceMatchResult: faceMatchResult.performed ? faceMatchResult.isMatch : null
    });
    
    // Return the result
    res.json({
      success: true,
      idVerification: {
        isValid: verificationResult.isValid,
        idType: verificationResult.idType,
        idNumber: verificationResult.idNumber
      },
      faceMatch: faceMatchResult.performed ? {
        isMatch: faceMatchResult.isMatch,
        confidence: faceMatchResult.confidence
      } : null,
      message: verificationResult.isValid ? 'ID verification successful' : 'Invalid ID document'
    });
  })
);

/**
 * @route POST /api/security/detect-multiple-people
 * @desc Detect if multiple people are present
 * @access Private
 */
router.post(
  '/detect-multiple-people',
  upload.single('image'),
  errorHandler.catchAsync(async (req, res) => {
    if (!req.file) {
      throw new errorHandler.ValidationError('Image is required');
    }
    
    // Get the image path
    const imagePath = req.file.path;
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Detect multiple people
    const detectionResult = await multiplePersonDetection.detectMultiplePeopleInFrame(imageBuffer);
    
    // Log the detection attempt
    logger.security('Multiple person detection', {
      userId: req.body.userId || 'unknown',
      multiplePeopleDetected: detectionResult.multiplePeopleDetected,
      faceCount: detectionResult.faceCount
    });
    
    // Return the result
    res.json({
      success: true,
      multiplePeopleDetected: detectionResult.multiplePeopleDetected,
      faceCount: detectionResult.faceCount,
      securityThreat: detectionResult.securityThreat,
      message: detectionResult.multiplePeopleDetected ? 
        'Multiple people detected in the frame' : 
        'Only one person detected in the frame'
    });
  })
);

/**
 * @route POST /api/security/detect-multiple-voices
 * @desc Detect if multiple voices are present
 * @access Private
 */
router.post(
  '/detect-multiple-voices',
  upload.single('audio'),
  errorHandler.catchAsync(async (req, res) => {
    if (!req.file) {
      throw new errorHandler.ValidationError('Audio file is required');
    }
    
    // Get the audio path
    const audioPath = req.file.path;
    
    // Read the audio file
    const audioBuffer = fs.readFileSync(audioPath);
    
    // Detect multiple voices
    const detectionResult = await voiceDetection.detectMultipleVoices(audioBuffer);
    
    // Log the detection attempt
    logger.security('Multiple voice detection', {
      userId: req.body.userId || 'unknown',
      multipleVoicesDetected: detectionResult.multipleVoicesDetected,
      confidence: detectionResult.confidence
    });
    
    // Return the result
    res.json({
      success: true,
      multipleVoicesDetected: detectionResult.multipleVoicesDetected,
      confidence: detectionResult.confidence,
      securityThreat: detectionResult.securityThreat,
      message: detectionResult.multipleVoicesDetected ? 
        'Multiple voices detected in the audio' : 
        'Only one voice detected in the audio'
    });
  })
);

/**
 * @route POST /api/security/detect-fraud
 * @desc Perform comprehensive fraud detection
 * @access Private
 */
router.post(
  '/detect-fraud',
  upload.single('image'),
  errorHandler.catchAsync(async (req, res) => {
    // Prepare vote data for fraud check
    const voteData = {
      faceImage: req.file ? fs.readFileSync(req.file.path) : null,
      userData: {
        userId: req.body.userId || 'unknown',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceId: req.body.deviceId || 'unknown'
      },
      recentActivities: JSON.parse(req.body.recentActivities || '[]'),
      userActions: JSON.parse(req.body.userActions || '[]')
    };
    
    // Perform comprehensive fraud check
    const fraudCheckResult = await fraudDetection.comprehensiveFraudCheck(voteData);
    
    // Log the fraud detection attempt
    logger.fraud('Fraud detection check', {
      userId: req.body.userId || 'unknown',
      fraudDetected: fraudCheckResult.fraudDetected,
      fraudProbability: fraudCheckResult.fraudProbability,
      riskLevel: fraudCheckResult.riskLevel
    });
    
    // Return the result
    res.json({
      success: true,
      fraudDetected: fraudCheckResult.fraudDetected,
      fraudProbability: fraudCheckResult.fraudProbability,
      riskLevel: fraudCheckResult.riskLevel,
      details: fraudCheckResult.details,
      message: fraudCheckResult.fraudDetected ? 
        `Potential fraud detected (Risk: ${fraudCheckResult.riskLevel})` : 
        'No fraud detected'
    });
  })
);

/**
 * @route POST /api/security/secure-vote
 * @desc Perform a secure vote with all security checks
 * @access Private
 */
router.post(
  '/secure-vote',
  upload.fields([
    { name: 'faceImage', maxCount: 1 },
    { name: 'idImage', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]),
  securityMiddleware.verifyFace,
  securityMiddleware.verifyID,
  securityMiddleware.detectMultiplePeople,
  securityMiddleware.detectMultipleVoices,
  securityMiddleware.detectFraud,
  errorHandler.catchAsync(async (req, res) => {
    // If we get here, all security checks have passed
    
    // Log the secure vote
    logger.vote('Secure vote cast', {
      userId: req.user ? req.user.id : 'unknown',
      candidateId: req.body.candidateId,
      electionId: req.body.electionId,
      securityChecks: {
        faceVerified: req.faceVerification ? req.faceVerification.verified : false,
        idVerified: req.idVerification ? req.idVerification.verified : false,
        multiplePeopleDetected: req.multiplePersonDetection ? req.multiplePersonDetection.multiplePeopleDetected : false,
        multipleVoicesDetected: req.multipleVoiceDetection ? req.multipleVoiceDetection.multipleVoicesDetected : false,
        fraudDetected: req.fraudDetection ? req.fraudDetection.fraudDetected : false
      }
    });
    
    // Return success with any warnings
    res.json({
      success: true,
      message: 'Vote cast successfully with all security checks passed',
      warnings: req.fraudWarning ? [req.fraudWarning] : []
    });
  })
);

module.exports = router;
