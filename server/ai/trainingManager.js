/**
 * Training Manager Module
 * 
 * This module manages the training process for document classification models,
 * including dataset management, training progress tracking, and model versioning.
 */

const fs = require('fs');
const path = require('path');
const documentClassification = require('./documentClassification');

// Training data storage paths
const TRAINING_DATA_PATH = path.join(__dirname, '../training_data');
const MODELS_BACKUP_PATH = path.join(__dirname, '../models/backups');
const TRAINING_LOGS_PATH = path.join(__dirname, '../logs/training');

// Ensure directories exist
[TRAINING_DATA_PATH, MODELS_BACKUP_PATH, TRAINING_LOGS_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Training session storage
let currentTrainingSession = null;
const trainingHistory = [];

/**
 * Initialize a new training session
 * @param {Object} config - Training configuration
 * @returns {Object} - Training session info
 */
function initializeTrainingSession(config = {}) {
  const sessionId = `training_${Date.now()}`;
  
  currentTrainingSession = {
    id: sessionId,
    startTime: new Date(),
    status: 'initialized',
    config: {
      epochs: config.epochs || 50,
      batchSize: config.batchSize || 32,
      learningRate: config.learningRate || 0.001,
      validationSplit: config.validationSplit || 0.2,
      ...config
    },
    progress: {
      currentEpoch: 0,
      totalEpochs: config.epochs || 50,
      currentLoss: null,
      currentAccuracy: null,
      bestAccuracy: 0,
      trainingTime: 0
    },
    datasets: {
      training: [],
      validation: [],
      test: []
    },
    metrics: {
      loss: [],
      accuracy: [],
      valLoss: [],
      valAccuracy: []
    }
  };
  
  console.log(`Training session ${sessionId} initialized`);
  return currentTrainingSession;
}

/**
 * Add training samples to the current session
 * @param {Array} samples - Array of training samples
 * @param {string} datasetType - Type of dataset (training, validation, test)
 * @returns {Object} - Operation result
 */
function addTrainingSamples(samples, datasetType = 'training') {
  try {
    if (!currentTrainingSession) {
      throw new Error('No active training session');
    }
    
    if (!['training', 'validation', 'test'].includes(datasetType)) {
      throw new Error('Invalid dataset type');
    }
    
    // Validate samples
    const validatedSamples = samples.map(sample => {
      if (!sample.filePath || !sample.documentType) {
        throw new Error('Invalid sample: missing filePath or documentType');
      }
      
      if (!Object.values(documentClassification.DOCUMENT_TYPES).includes(sample.documentType)) {
        throw new Error(`Invalid document type: ${sample.documentType}`);
      }
      
      return {
        id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filePath: sample.filePath,
        documentType: sample.documentType,
        metadata: sample.metadata || {},
        addedAt: new Date()
      };
    });
    
    // Add to session
    currentTrainingSession.datasets[datasetType].push(...validatedSamples);
    
    console.log(`Added ${validatedSamples.length} samples to ${datasetType} dataset`);
    
    return {
      success: true,
      samplesAdded: validatedSamples.length,
      totalSamples: currentTrainingSession.datasets[datasetType].length
    };
  } catch (error) {
    console.error('Error adding training samples:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get training session statistics
 * @returns {Object} - Session statistics
 */
function getTrainingSessionStats() {
  if (!currentTrainingSession) {
    return { error: 'No active training session' };
  }
  
  const stats = {
    sessionId: currentTrainingSession.id,
    status: currentTrainingSession.status,
    startTime: currentTrainingSession.startTime,
    progress: currentTrainingSession.progress,
    datasetStats: {
      training: currentTrainingSession.datasets.training.length,
      validation: currentTrainingSession.datasets.validation.length,
      test: currentTrainingSession.datasets.test.length
    },
    documentTypeDistribution: getDocumentTypeDistribution(),
    config: currentTrainingSession.config
  };
  
  return stats;
}

/**
 * Get document type distribution in training data
 * @returns {Object} - Document type counts
 */
function getDocumentTypeDistribution() {
  if (!currentTrainingSession) {
    return {};
  }
  
  const distribution = {};
  const allSamples = [
    ...currentTrainingSession.datasets.training,
    ...currentTrainingSession.datasets.validation,
    ...currentTrainingSession.datasets.test
  ];
  
  allSamples.forEach(sample => {
    distribution[sample.documentType] = (distribution[sample.documentType] || 0) + 1;
  });
  
  return distribution;
}

/**
 * Start training with the current session data
 * @returns {Promise<Object>} - Training results
 */
async function startTraining() {
  try {
    if (!currentTrainingSession) {
      throw new Error('No active training session');
    }
    
    if (currentTrainingSession.datasets.training.length === 0) {
      throw new Error('No training data available');
    }
    
    console.log('Starting training process...');
    currentTrainingSession.status = 'training';
    currentTrainingSession.progress.trainingStartTime = new Date();
    
    // Prepare training files for the document classification model
    const trainingFiles = currentTrainingSession.datasets.training.map(sample => ({
      path: sample.filePath,
      documentType: sample.documentType
    }));
    
    // Create progress callback
    const progressCallback = (epoch, logs) => {
      currentTrainingSession.progress.currentEpoch = epoch + 1;
      currentTrainingSession.progress.currentLoss = logs.loss;
      currentTrainingSession.progress.currentAccuracy = logs.acc;
      
      if (logs.acc > currentTrainingSession.progress.bestAccuracy) {
        currentTrainingSession.progress.bestAccuracy = logs.acc;
      }
      
      // Store metrics
      currentTrainingSession.metrics.loss.push(logs.loss);
      currentTrainingSession.metrics.accuracy.push(logs.acc);
      
      if (logs.val_loss) {
        currentTrainingSession.metrics.valLoss.push(logs.val_loss);
      }
      if (logs.val_acc) {
        currentTrainingSession.metrics.valAccuracy.push(logs.val_acc);
      }
      
      console.log(`Training progress: Epoch ${epoch + 1}/${currentTrainingSession.progress.totalEpochs}, Loss: ${logs.loss.toFixed(4)}, Accuracy: ${logs.acc.toFixed(4)}`);
    };
    
    // Start training
    const trainingResult = await documentClassification.trainDocumentClassificationModel(
      trainingFiles,
      {
        ...currentTrainingSession.config,
        progressCallback: progressCallback
      }
    );
    
    // Update session status
    if (trainingResult.success) {
      currentTrainingSession.status = 'completed';
      currentTrainingSession.endTime = new Date();
      currentTrainingSession.progress.trainingTime = 
        currentTrainingSession.endTime - currentTrainingSession.progress.trainingStartTime;
      
      // Save training session to history
      trainingHistory.push({ ...currentTrainingSession });
      
      // Save training log
      await saveTrainingLog(currentTrainingSession);
      
      console.log('Training completed successfully');
    } else {
      currentTrainingSession.status = 'failed';
      currentTrainingSession.error = trainingResult.error;
      console.error('Training failed:', trainingResult.error);
    }
    
    return {
      success: trainingResult.success,
      sessionId: currentTrainingSession.id,
      trainingStats: currentTrainingSession.progress,
      error: trainingResult.error
    };
  } catch (error) {
    console.error('Error starting training:', error);
    
    if (currentTrainingSession) {
      currentTrainingSession.status = 'failed';
      currentTrainingSession.error = error.message;
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Save training log to file
 * @param {Object} session - Training session data
 * @returns {Promise<void>}
 */
async function saveTrainingLog(session) {
  try {
    const logFileName = `training_log_${session.id}.json`;
    const logFilePath = path.join(TRAINING_LOGS_PATH, logFileName);
    
    const logData = {
      sessionId: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      config: session.config,
      progress: session.progress,
      metrics: session.metrics,
      datasetStats: {
        training: session.datasets.training.length,
        validation: session.datasets.validation.length,
        test: session.datasets.test.length
      },
      documentTypeDistribution: getDocumentTypeDistribution()
    };
    
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    console.log(`Training log saved to ${logFilePath}`);
  } catch (error) {
    console.error('Error saving training log:', error);
  }
}

/**
 * Get training history
 * @returns {Array} - Array of past training sessions
 */
function getTrainingHistory() {
  return trainingHistory.map(session => ({
    id: session.id,
    startTime: session.startTime,
    endTime: session.endTime,
    status: session.status,
    finalAccuracy: session.progress.bestAccuracy,
    trainingTime: session.progress.trainingTime,
    sampleCount: session.datasets.training.length
  }));
}

/**
 * Clear current training session
 */
function clearCurrentSession() {
  currentTrainingSession = null;
  console.log('Training session cleared');
}

module.exports = {
  initializeTrainingSession,
  addTrainingSamples,
  getTrainingSessionStats,
  getDocumentTypeDistribution,
  startTraining,
  saveTrainingLog,
  getTrainingHistory,
  clearCurrentSession,
  getCurrentSession: () => currentTrainingSession
};
