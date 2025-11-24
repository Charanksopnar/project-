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

// Import Voter model for database operations
const mockDb = require('../mockDb');

// Import new services for 3-layer verification
const ocrService = require('../services/ocrService');
const imageComparisonService = require('../services/imageComparisonService');
const verificationCaseService = require('../services/verificationCaseService');

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

    // Verify against pre-fed database
    const extractedIdNumber = req.body.idNumber || 'ABC1234567'; // In real app, this comes from OCR
    const extractedName = req.body.name || 'Charan K S'; // In real app, this comes from OCR

    // Simulate OCR extraction delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const preFedRecord = mockDb.preFedIDs.find(
      record => record.idNumber === extractedIdNumber &&
        record.idType.toLowerCase() === idType.toLowerCase()
    );

    verificationResult = {
      success: false,
      isValid: false,
      idType: idType,
      confidence: 0,
      message: 'ID not found in government records'
    };

    if (preFedRecord) {
      // Check name match (simple inclusion check for mock)
      const nameMatch = preFedRecord.name.toLowerCase().includes(extractedName.toLowerCase()) ||
        extractedName.toLowerCase().includes(preFedRecord.name.toLowerCase());

      if (nameMatch) {
        verificationResult = {
          success: true,
          isValid: true,
          idType: idType,
          idNumber: preFedRecord.idNumber,
          confidence: 98,
          extractedFields: {
            name: preFedRecord.name,
            dob: preFedRecord.dob,
            gender: preFedRecord.gender,
            idNumber: preFedRecord.idNumber
          }
        };
      } else {
        verificationResult.message = 'Name mismatch with government records';
      }
    }

    // If face image is provided, match face on ID with user's face
    let faceMatchResult = { performed: false };

    if (req.files.faceImage) {
      const faceImagePath = req.files.faceImage[0].path;
      const faceImageBuffer = fs.readFileSync(faceImagePath);

      faceMatchResult = await idVerification.matchFaceWithID(idImageBuffer, faceImageBuffer);
      faceMatchResult.performed = true;
    }

    // Calculate overall confidence score
    let overallConfidence = 0;
    if (verificationResult.success && verificationResult.isValid) {
      overallConfidence = verificationResult.confidence || 85;

      if (faceMatchResult.performed) {
        const faceConfidence = faceMatchResult.confidence || 0;
        overallConfidence = (overallConfidence * 0.6) + (faceConfidence * 0.4);
      }
    }

    // Save to database if voterId is provided
    const voterId = req.query.voterId || req.body.voterId;
    let dbUpdateSuccess = false;

    if (voterId) {
      try {
        const voter = mockDb.voters.find(v => v._id === voterId);

        if (voter) {
          // Determine verification status based on confidence
          let verificationStatus = 'pending';
          if (overallConfidence >= 95) {
            verificationStatus = 'verified';
            voter.verified = true;
          } else if (overallConfidence >= 40) { // Lowered threshold for manual review
            verificationStatus = 'pending';
          } else {
            verificationStatus = 'rejected';
          }

          voter.verificationStatus = verificationStatus;
          voter.kycData = {
            voterId: verificationResult.idNumber || 'N/A',
            fullName: voter.name,
            dateOfBirth: voter.dob,
            address: voter.address,
            submittedAt: new Date()
          };

          voter.kycDocuments = {
            idDocument: {
              filename: req.files.idImage[0].filename,
              uploadedAt: new Date(),
              mimeType: req.files.idImage[0].mimetype
            },
            selfie: req.files.faceImage ? {
              filename: req.files.faceImage[0].filename,
              uploadedAt: new Date(),
              mimeType: req.files.faceImage[0].mimetype
            } : null
          };

          if (verificationStatus === 'verified') {
            voter.kycApprovedAt = new Date();
          } else if (verificationStatus === 'rejected') {
            voter.kycRejectedAt = new Date();
            voter.kycRejectionReason = 'Low confidence score from automated verification';
          }

          voter.kycSubmissionAttempts = (voter.kycSubmissionAttempts || 0) + 1;
          dbUpdateSuccess = true;

          logger.info(`KYC data saved for voter ${voterId} with status: ${verificationStatus}`);
        }
      } catch (dbError) {
        logger.error('Error saving KYC data to database:', dbError);
      }
    }

    // Log the verification attempt
    logger.biometric('ID verification attempt', {
      userId: voterId || req.body.userId || 'unknown',
      idType: idType,
      isValid: verificationResult.isValid,
      confidence: overallConfidence,
      faceMatchPerformed: faceMatchResult.performed,
      faceMatchResult: faceMatchResult.performed ? faceMatchResult.isMatch : null,
      dbUpdateSuccess
    });

    // Return the result
    res.json({
      success: true,
      idVerification: {
        isValid: verificationResult.isValid,
        idType: verificationResult.idType,
        idNumber: verificationResult.idNumber,
        confidence: overallConfidence,
        extractedFields: verificationResult.extractedFields || {},
        fieldConfidence: verificationResult.fieldConfidence || {},
        needsManualReview: verificationResult.needsManualReview || false,
        ocrConfidence: verificationResult.ocrConfidence || 0
      },
      faceMatch: faceMatchResult.performed ? {
        isMatch: faceMatchResult.isMatch,
        confidence: faceMatchResult.confidence
      } : null,
      verificationStatus: dbUpdateSuccess ? (overallConfidence >= 95 ? 'verified' : overallConfidence >= 40 ? 'pending' : 'rejected') : null,
      message: verificationResult.isValid ? 'ID verification successful' : 'Invalid ID document',
      dbSaved: dbUpdateSuccess
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

/**
 * @route POST /api/security/submit-liveness
 * @desc Submit multi-angle face liveness data
 * @access Private
 */
router.post(
  '/submit-liveness',
  upload.fields([
    { name: 'front', maxCount: 1 },
    { name: 'top', maxCount: 1 },
    { name: 'bottom', maxCount: 1 },
    { name: 'left', maxCount: 1 },
    { name: 'right', maxCount: 1 }
  ]),
  errorHandler.catchAsync(async (req, res) => {
    const { voterId } = req.body;

    if (!voterId) {
      throw new errorHandler.ValidationError('Voter ID is required');
    }

    const voter = mockDb.voters.find(v => v._id === voterId);
    if (!voter) {
      throw new errorHandler.ValidationError('Voter not found');
    }

    // Update liveness data
    const livenessData = {
      completedAt: new Date()
    };

    ['front', 'top', 'bottom', 'left', 'right'].forEach(angle => {
      if (req.files[angle] && req.files[angle][0]) {
        livenessData[angle] = {
          filename: req.files[angle][0].filename,
          uploadedAt: new Date()
        };
      }
    });

    voter.livenessData = livenessData;
    voter.faceEnrolled = true; // Mark as enrolled

    // If ID verification was already pending/verified, we can consider this a complete success

    logger.info(`Liveness data (5 angles) saved for voter ${voterId}`);

    res.json({
      success: true,
      message: 'Face enrollment completed successfully',
      livenessData
    });
  })
);

/**
 * @route POST /api/security/voting-session-check
 * @desc Real-time security check during voting session
 * @access Private
 */
router.post(
  '/voting-session-check',
  upload.single('frame'),
  errorHandler.catchAsync(async (req, res) => {
    const { voterId, electionId } = req.body;

    if (!req.file) {
      // Allow simulation mode / no-camera voting
      return res.json({
        success: true,
        violation: false,
        message: 'Simulation mode: No frame received',
        faceCount: 1 // Simulate 1 face
      });
    }

    // 1. Detect Multiple People
    const imageBuffer = fs.readFileSync(req.file.path);
    const detectionResult = await multiplePersonDetection.detectMultiplePeopleInFrame(imageBuffer);

    let violation = false;
    let violationType = null;
    let message = 'Checks passed';

    if (detectionResult.multiplePeopleDetected) {
      violation = true;
      violationType = 'MULTIPLE_FACES';
      message = 'Multiple people detected in frame';
    } else if (detectionResult.faceCount === 0) {
      violation = true;
      violationType = 'NO_FACE';
      message = 'No face detected in frame';
    }

    // 2. Face Match (if face detected)
    if (!violation && detectionResult.faceCount === 1) {
      // Fetch voter's enrolled face
      const voter = mockDb.voters.find(v => v._id === voterId);
      if (voter && voter.livenessData && voter.livenessData.front) {
        const enrolledPath = path.join(__dirname, '../uploads/', voter.livenessData.front.filename);
        if (fs.existsSync(enrolledPath)) {
          const enrolledBuffer = fs.readFileSync(enrolledPath);
          const matchResult = await faceRecognition.compareFaces(imageBuffer, enrolledBuffer);

          if (!matchResult.isMatch) {
            violation = true;
            violationType = 'FACE_MISMATCH';
            message = 'Face does not match enrolled user';
          }
        }
      }
    }

    // Log violation if any
    if (violation) {
      // Fetch voter to update violation count
      const voter = mockDb.voters.find(v => v._id === voterId);
      if (voter) {
        voter.violationCount = (voter.violationCount || 0) + 1;

        // Determine warning level
        if (voter.violationCount === 1) {
          message = `Warning 1: ${message}. Please ensure only you are in frame with a clear face.`;
        } else if (voter.violationCount === 2) {
          message = `Warning 2: ${message}. Further violations will block your vote.`;
        } else if (voter.violationCount >= 3) {
          voter.isBlocked = true;
          voter.blockedReason = 'Repeated security violations during voting';
          voter.blockedAt = new Date();
          message = 'Your voting attempt has been blocked due to repeated rule violations.';
        }
      }

      logger.security('Voting violation detected', {
        voterId,
        electionId,
        violationType,
        violationCount: voter ? voter.violationCount : 1,
        timestamp: new Date()
      });

      // Emit socket event to admins
      const io = req.app.get('io');
      if (io) {
        io.emit('admin:security-alert', {
          type: 'VOTING_VIOLATION',
          voterId,
          electionId,
          violationType,
          message,
          timestamp: new Date()
        });
      }

      // Persist violation to invalidVotes.json
      try {
        const dataDir = path.join(__dirname, '..', 'utils', 'data');
        const invalidFile = path.join(dataDir, 'invalidVotes.json');

        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        let invalidVotes = [];
        if (fs.existsSync(invalidFile)) {
          try {
            const raw = fs.readFileSync(invalidFile, 'utf8');
            invalidVotes = raw ? JSON.parse(raw) : [];
          } catch (e) {
            invalidVotes = [];
          }
        }

        const newViolation = {
          id: `vio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          voterId,
          electionId: electionId || 'N/A',
          candidateId: 'N/A', // Not available in this check
          violationType: violationType,
          violationDetails: message,
          timestamp: new Date().toISOString()
        };

        invalidVotes.push(newViolation);
        fs.writeFileSync(invalidFile, JSON.stringify(invalidVotes, null, 2));

        logger.info(`Violation recorded to invalidVotes.json for voter ${voterId}`);
      } catch (err) {
        logger.error('Error saving invalid vote record:', err);
      }
    }

    // Clean up uploaded frame
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      violation,
      violationType,
      message,
      faceCount: detectionResult.faceCount,
      isBlocked: mockDb.voters.find(v => v._id === voterId)?.isBlocked || false,
      violationCount: mockDb.voters.find(v => v._id === voterId)?.violationCount || 0
    });
  })
);

module.exports = router;
