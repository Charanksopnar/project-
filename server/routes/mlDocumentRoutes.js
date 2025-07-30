/**
 * ML Document Routes Module
 * 
 * This module defines the API routes for machine learning document identification,
 * training, and management features.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import ML modules (using demo version temporarily)
const documentClassification = require('../ai/documentClassificationDemo');
// const trainingManager = require('../ai/trainingManager'); // Commented out due to TensorFlow dependency

// Mock training manager for demo purposes
const mockTrainingManager = {
  initializeTrainingSession: (config) => ({
    id: 'demo-session-' + Date.now(),
    config: config,
    status: 'initialized',
    createdAt: new Date()
  }),
  addTrainingSamples: (samples, datasetType) => ({
    success: true,
    samplesAdded: samples.length,
    datasetType: datasetType
  }),
  getTrainingSessionStats: () => ({
    status: 'ready',
    datasetStats: { training: 0, validation: 0, test: 0 },
    sessionId: 'demo-session',
    demoMode: true
  }),
  startTraining: async () => ({
    success: true,
    sessionId: 'demo-session',
    message: 'Training completed (demo mode)',
    demoMode: true
  }),
  getTrainingHistory: () => ([
    {
      sessionId: 'demo-session-1',
      startTime: new Date(Date.now() - 86400000),
      endTime: new Date(Date.now() - 86000000),
      finalAccuracy: 0.92,
      status: 'completed',
      demoMode: true
    }
  ]),
  clearCurrentSession: () => true
};

// Import middleware
const errorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/ml_training');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 50 // Maximum 50 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route POST /api/ml-documents/classify
 * @desc Classify a document image using ML
 * @access Private
 */
router.post('/classify', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document image provided'
      });
    }

    logger.info(`Document classification request for file: ${req.file.filename}`);

    // Read the uploaded file
    const imageBuffer = fs.readFileSync(req.file.path);

    // Classify the document
    const classificationResult = await documentClassification.classifyDocument(imageBuffer);

    // Extract additional features
    const featuresResult = await documentClassification.extractDocumentFeatures(imageBuffer);

    // Validate authenticity
    const validationResult = await documentClassification.validateDocumentAuthenticity(imageBuffer);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const response = {
      success: true,
      classification: classificationResult,
      features: featuresResult.success ? featuresResult : null,
      validation: validationResult.success ? validationResult : null,
      timestamp: new Date().toISOString()
    };

    logger.info(`Document classification completed: ${classificationResult.documentType} (confidence: ${classificationResult.confidence})`);

    res.json(response);
  } catch (error) {
    logger.error('Error in document classification:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/ml-documents/training/session/init
 * @desc Initialize a new training session
 * @access Private
 */
router.post('/training/session/init', async (req, res) => {
  try {
    const config = req.body.config || {};
    
    logger.info('Initializing new training session with config:', config);
    
    const session = mockTrainingManager.initializeTrainingSession(config);
    
    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        config: session.config,
        startTime: session.startTime
      }
    });
  } catch (error) {
    logger.error('Error initializing training session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/ml-documents/training/samples/upload
 * @desc Upload training samples
 * @access Private
 */
router.post('/training/samples/upload', upload.array('samples', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No training samples provided'
      });
    }

    const { documentTypes, datasetType = 'training' } = req.body;
    
    if (!documentTypes) {
      return res.status(400).json({
        success: false,
        error: 'Document types not specified'
      });
    }

    // Parse document types (should be JSON string)
    let parsedDocumentTypes;
    try {
      parsedDocumentTypes = JSON.parse(documentTypes);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document types format'
      });
    }

    if (parsedDocumentTypes.length !== req.files.length) {
      return res.status(400).json({
        success: false,
        error: 'Number of document types must match number of files'
      });
    }

    logger.info(`Uploading ${req.files.length} training samples to ${datasetType} dataset`);

    // Prepare samples
    const samples = req.files.map((file, index) => ({
      filePath: file.path,
      documentType: parsedDocumentTypes[index],
      metadata: {
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date()
      }
    }));

    // Add samples to training session
    const result = mockTrainingManager.addTrainingSamples(samples, datasetType);

    if (result.success) {
      logger.info(`Successfully added ${result.samplesAdded} samples to training session`);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error uploading training samples:', error);
    
    // Clean up uploaded files
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/ml-documents/training/session/stats
 * @desc Get current training session statistics
 * @access Private
 */
router.get('/training/session/stats', async (req, res) => {
  try {
    const stats = mockTrainingManager.getTrainingSessionStats();
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    logger.error('Error getting training session stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/ml-documents/training/start
 * @desc Start training with current session data
 * @access Private
 */
router.post('/training/start', async (req, res) => {
  try {
    logger.info('Starting ML model training...');
    
    const trainingResult = await mockTrainingManager.startTraining();
    
    if (trainingResult.success) {
      logger.info(`Training completed successfully for session: ${trainingResult.sessionId}`);
    } else {
      logger.error(`Training failed: ${trainingResult.error}`);
    }
    
    res.json(trainingResult);
  } catch (error) {
    logger.error('Error starting training:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/ml-documents/training/history
 * @desc Get training history
 * @access Private
 */
router.get('/training/history', async (req, res) => {
  try {
    const history = mockTrainingManager.getTrainingHistory();
    
    res.json({
      success: true,
      history: history
    });
  } catch (error) {
    logger.error('Error getting training history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/ml-documents/training/session/clear
 * @desc Clear current training session
 * @access Private
 */
router.delete('/training/session/clear', async (req, res) => {
  try {
    mockTrainingManager.clearCurrentSession();
    
    logger.info('Training session cleared');
    
    res.json({
      success: true,
      message: 'Training session cleared successfully'
    });
  } catch (error) {
    logger.error('Error clearing training session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/ml-documents/document-types
 * @desc Get supported document types
 * @access Public
 */
router.get('/document-types', async (req, res) => {
  try {
    res.json({
      success: true,
      documentTypes: documentClassification.DOCUMENT_TYPES,
      supportedTypes: Object.values(documentClassification.DOCUMENT_TYPES)
    });
  } catch (error) {
    logger.error('Error getting document types:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
