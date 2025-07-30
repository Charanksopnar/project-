/**
 * Document Classification ML Module
 * 
 * This module provides machine learning capabilities for document identification,
 * classification, and training. It supports multiple document types and allows
 * custom training with new document samples.
 */

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const tesseract = require('node-tesseract-ocr');
const canvas = require('canvas');

// Document types supported by the system
const DOCUMENT_TYPES = {
  AADHAR: 'aadhar',
  VOTER_ID: 'voter_id',
  DRIVING_LICENSE: 'driving_license',
  PASSPORT: 'passport',
  PAN_CARD: 'pan_card',
  BANK_STATEMENT: 'bank_statement',
  UTILITY_BILL: 'utility_bill',
  UNKNOWN: 'unknown'
};

// Paths for models and training data
const MODELS_PATH = path.join(__dirname, '../models/document_classification');
const TRAINING_DATA_PATH = path.join(__dirname, '../training_data/documents');
const TEMP_PATH = path.join(__dirname, '../temp');

// Ensure directories exist
[MODELS_PATH, TRAINING_DATA_PATH, TEMP_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Model instances
let documentClassificationModel = null;
let featureExtractionModel = null;
let documentValidationModel = null;

// Training configuration
const TRAINING_CONFIG = {
  batchSize: 32,
  epochs: 50,
  learningRate: 0.001,
  validationSplit: 0.2,
  imageSize: [224, 224],
  numClasses: Object.keys(DOCUMENT_TYPES).length
};

/**
 * Initialize the document classification system
 * @returns {Promise<boolean>} - Success status
 */
async function initializeDocumentClassification() {
  try {
    console.log('Initializing document classification system...');
    
    // Load or create models
    await loadOrCreateModels();
    
    console.log('Document classification system initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing document classification system:', error);
    return false;
  }
}

/**
 * Load existing models or create new ones
 * @returns {Promise<void>}
 */
async function loadOrCreateModels() {
  try {
    // Try to load existing models
    const classificationModelPath = path.join(MODELS_PATH, 'classification/model.json');
    const featureModelPath = path.join(MODELS_PATH, 'feature_extraction/model.json');
    const validationModelPath = path.join(MODELS_PATH, 'validation/model.json');
    
    if (fs.existsSync(classificationModelPath)) {
      documentClassificationModel = await tf.loadLayersModel(`file://${classificationModelPath}`);
      console.log('Loaded existing document classification model');
    } else {
      documentClassificationModel = createDocumentClassificationModel();
      console.log('Created new document classification model');
    }
    
    if (fs.existsSync(featureModelPath)) {
      featureExtractionModel = await tf.loadLayersModel(`file://${featureModelPath}`);
      console.log('Loaded existing feature extraction model');
    } else {
      featureExtractionModel = createFeatureExtractionModel();
      console.log('Created new feature extraction model');
    }
    
    if (fs.existsSync(validationModelPath)) {
      documentValidationModel = await tf.loadLayersModel(`file://${validationModelPath}`);
      console.log('Loaded existing document validation model');
    } else {
      documentValidationModel = createDocumentValidationModel();
      console.log('Created new document validation model');
    }
  } catch (error) {
    console.error('Error loading/creating models:', error);
    throw error;
  }
}

/**
 * Create a new document classification model
 * @returns {tf.LayersModel} - The created model
 */
function createDocumentClassificationModel() {
  const model = tf.sequential({
    layers: [
      // Input layer
      tf.layers.inputLayer({ inputShape: [224, 224, 3] }),
      
      // Convolutional layers for feature extraction
      tf.layers.conv2d({
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
      }),
      tf.layers.maxPooling2d({ poolSize: 2 }),
      
      tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
      }),
      tf.layers.maxPooling2d({ poolSize: 2 }),
      
      tf.layers.conv2d({
        filters: 128,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
      }),
      tf.layers.maxPooling2d({ poolSize: 2 }),
      
      tf.layers.conv2d({
        filters: 256,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
      }),
      tf.layers.globalAveragePooling2d(),
      
      // Dense layers for classification
      tf.layers.dense({
        units: 512,
        activation: 'relu'
      }),
      tf.layers.dropout({ rate: 0.5 }),
      
      tf.layers.dense({
        units: 256,
        activation: 'relu'
      }),
      tf.layers.dropout({ rate: 0.3 }),
      
      // Output layer
      tf.layers.dense({
        units: TRAINING_CONFIG.numClasses,
        activation: 'softmax'
      })
    ]
  });
  
  // Compile the model
  model.compile({
    optimizer: tf.train.adam(TRAINING_CONFIG.learningRate),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  return model;
}

/**
 * Create a feature extraction model for document analysis
 * @returns {tf.LayersModel} - The created model
 */
function createFeatureExtractionModel() {
  const model = tf.sequential({
    layers: [
      tf.layers.inputLayer({ inputShape: [224, 224, 3] }),
      
      // Feature extraction layers
      tf.layers.conv2d({
        filters: 64,
        kernelSize: 5,
        activation: 'relu',
        padding: 'same'
      }),
      tf.layers.maxPooling2d({ poolSize: 2 }),
      
      tf.layers.conv2d({
        filters: 128,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
      }),
      tf.layers.maxPooling2d({ poolSize: 2 }),
      
      tf.layers.conv2d({
        filters: 256,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
      }),
      tf.layers.globalAveragePooling2d(),
      
      // Feature representation layer
      tf.layers.dense({
        units: 1024,
        activation: 'relu',
        name: 'feature_vector'
      })
    ]
  });
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });
  
  return model;
}

/**
 * Create a document validation model for authenticity checking
 * @returns {tf.LayersModel} - The created model
 */
function createDocumentValidationModel() {
  const model = tf.sequential({
    layers: [
      tf.layers.inputLayer({ inputShape: [1024] }), // Takes feature vectors as input
      
      tf.layers.dense({
        units: 512,
        activation: 'relu'
      }),
      tf.layers.dropout({ rate: 0.4 }),
      
      tf.layers.dense({
        units: 256,
        activation: 'relu'
      }),
      tf.layers.dropout({ rate: 0.3 }),
      
      tf.layers.dense({
        units: 128,
        activation: 'relu'
      }),
      
      // Binary classification: authentic vs fake
      tf.layers.dense({
        units: 2,
        activation: 'softmax'
      })
    ]
  });
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  return model;
}

/**
 * Preprocess image for model input
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Promise<tf.Tensor>} - Preprocessed image tensor
 */
async function preprocessImage(imageBuffer) {
  try {
    // Decode image
    const image = await tf.node.decodeImage(imageBuffer, 3);

    // Resize to model input size
    const resized = tf.image.resizeBilinear(image, TRAINING_CONFIG.imageSize);

    // Normalize pixel values to [0, 1]
    const normalized = resized.div(255.0);

    // Add batch dimension
    const batched = normalized.expandDims(0);

    // Clean up intermediate tensors
    image.dispose();
    resized.dispose();
    normalized.dispose();

    return batched;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw error;
  }
}

/**
 * Classify a document image
 * @param {Buffer} imageBuffer - The document image buffer
 * @returns {Promise<Object>} - Classification results
 */
async function classifyDocument(imageBuffer) {
  try {
    if (!documentClassificationModel) {
      throw new Error('Document classification model not initialized');
    }

    // Preprocess the image
    const preprocessedImage = await preprocessImage(imageBuffer);

    // Make prediction
    const prediction = documentClassificationModel.predict(preprocessedImage);
    const probabilities = await prediction.data();

    // Get the predicted class
    const predictedClassIndex = prediction.argMax(-1).dataSync()[0];
    const confidence = probabilities[predictedClassIndex];

    // Map index to document type
    const documentTypes = Object.values(DOCUMENT_TYPES);
    const predictedType = documentTypes[predictedClassIndex] || DOCUMENT_TYPES.UNKNOWN;

    // Clean up tensors
    preprocessedImage.dispose();
    prediction.dispose();

    return {
      success: true,
      documentType: predictedType,
      confidence: confidence,
      probabilities: {
        [DOCUMENT_TYPES.AADHAR]: probabilities[0],
        [DOCUMENT_TYPES.VOTER_ID]: probabilities[1],
        [DOCUMENT_TYPES.DRIVING_LICENSE]: probabilities[2],
        [DOCUMENT_TYPES.PASSPORT]: probabilities[3],
        [DOCUMENT_TYPES.PAN_CARD]: probabilities[4],
        [DOCUMENT_TYPES.BANK_STATEMENT]: probabilities[5],
        [DOCUMENT_TYPES.UTILITY_BILL]: probabilities[6],
        [DOCUMENT_TYPES.UNKNOWN]: probabilities[7]
      }
    };
  } catch (error) {
    console.error('Error classifying document:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract features from a document image
 * @param {Buffer} imageBuffer - The document image buffer
 * @returns {Promise<Object>} - Extracted features
 */
async function extractDocumentFeatures(imageBuffer) {
  try {
    if (!featureExtractionModel) {
      throw new Error('Feature extraction model not initialized');
    }

    // Preprocess the image
    const preprocessedImage = await preprocessImage(imageBuffer);

    // Extract features
    const features = featureExtractionModel.predict(preprocessedImage);
    const featureVector = await features.data();

    // Also extract text using OCR
    const ocrResult = await extractTextFeatures(imageBuffer);

    // Clean up tensors
    preprocessedImage.dispose();
    features.dispose();

    return {
      success: true,
      visualFeatures: Array.from(featureVector),
      textFeatures: ocrResult.textFeatures,
      extractedText: ocrResult.extractedText,
      layoutFeatures: await extractLayoutFeatures(imageBuffer)
    };
  } catch (error) {
    console.error('Error extracting document features:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract text features using OCR
 * @param {Buffer} imageBuffer - The document image buffer
 * @returns {Promise<Object>} - Text features
 */
async function extractTextFeatures(imageBuffer) {
  try {
    // Save buffer to temporary file for OCR
    const tempFilePath = path.join(TEMP_PATH, `temp_doc_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, imageBuffer);

    // Perform OCR
    const extractedText = await tesseract.recognize(tempFilePath, {
      lang: 'eng',
      oem: 1,
      psm: 3
    });

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    // Analyze text patterns
    const textFeatures = analyzeTextPatterns(extractedText);

    return {
      extractedText: extractedText,
      textFeatures: textFeatures
    };
  } catch (error) {
    console.error('Error extracting text features:', error);
    return {
      extractedText: '',
      textFeatures: {}
    };
  }
}

/**
 * Extract layout features from document image
 * @param {Buffer} imageBuffer - The document image buffer
 * @returns {Promise<Object>} - Layout features
 */
async function extractLayoutFeatures(imageBuffer) {
  try {
    // Load image using canvas
    const img = await canvas.loadImage(imageBuffer);
    const canvasElement = canvas.createCanvas(img.width, img.height);
    const ctx = canvasElement.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    // Analyze layout features
    const features = {
      width: img.width,
      height: img.height,
      aspectRatio: img.width / img.height,
      brightness: calculateAverageBrightness(data),
      contrast: calculateContrast(data),
      textDensity: await calculateTextDensity(imageBuffer),
      edgeDensity: calculateEdgeDensity(data, img.width, img.height)
    };

    return features;
  } catch (error) {
    console.error('Error extracting layout features:', error);
    return {};
  }
}

/**
 * Calculate average brightness of image
 * @param {Uint8ClampedArray} data - Image pixel data
 * @returns {number} - Average brightness (0-255)
 */
function calculateAverageBrightness(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    // Calculate luminance using standard formula
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / (data.length / 4);
}

/**
 * Calculate contrast of image
 * @param {Uint8ClampedArray} data - Image pixel data
 * @returns {number} - Contrast measure
 */
function calculateContrast(data) {
  const brightness = calculateAverageBrightness(data);
  let sumSquaredDiff = 0;

  for (let i = 0; i < data.length; i += 4) {
    const pixelBrightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sumSquaredDiff += Math.pow(pixelBrightness - brightness, 2);
  }

  return Math.sqrt(sumSquaredDiff / (data.length / 4));
}

/**
 * Calculate text density in image
 * @param {Buffer} imageBuffer - The document image buffer
 * @returns {Promise<number>} - Text density ratio
 */
async function calculateTextDensity(imageBuffer) {
  try {
    // This is a simplified text density calculation
    // In a real implementation, you might use more sophisticated methods
    const tempFilePath = path.join(TEMP_PATH, `temp_density_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, imageBuffer);

    const text = await tesseract.recognize(tempFilePath, {
      lang: 'eng',
      oem: 1,
      psm: 6
    });

    fs.unlinkSync(tempFilePath);

    // Calculate text density as ratio of text characters to image area
    const textLength = text.replace(/\s/g, '').length;
    return textLength / 10000; // Normalized density
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate edge density using simple edge detection
 * @param {Uint8ClampedArray} data - Image pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {number} - Edge density
 */
function calculateEdgeDensity(data, width, height) {
  let edgeCount = 0;
  const threshold = 30;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const current = data[idx];
      const right = data[idx + 4];
      const bottom = data[(y + 1) * width * 4 + x * 4];

      if (Math.abs(current - right) > threshold || Math.abs(current - bottom) > threshold) {
        edgeCount++;
      }
    }
  }

  return edgeCount / (width * height);
}

/**
 * Analyze text patterns in extracted text
 * @param {string} text - The extracted text
 * @returns {Object} - Text pattern analysis
 */
function analyzeTextPatterns(text) {
  const patterns = {
    hasAadharNumber: /\d{4}\s\d{4}\s\d{4}/.test(text),
    hasVoterIdNumber: /[A-Z]{3}\d{7}/.test(text),
    hasDrivingLicenseNumber: /[A-Z]{2}\d{2}\s\d{11}/.test(text),
    hasPanNumber: /[A-Z]{5}\d{4}[A-Z]/.test(text),
    hasPassportNumber: /[A-Z]\d{7}/.test(text),
    hasDatePattern: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text),
    hasAddressKeywords: /(address|addr|residence|house|street|city|state|pin|pincode)/i.test(text),
    hasGovernmentKeywords: /(government|india|bharat|election|commission|transport|passport)/i.test(text),
    wordCount: text.split(/\s+/).length,
    digitCount: (text.match(/\d/g) || []).length,
    upperCaseCount: (text.match(/[A-Z]/g) || []).length
  };

  return patterns;
}

/**
 * Validate document authenticity using ML model
 * @param {Buffer} imageBuffer - The document image buffer
 * @returns {Promise<Object>} - Validation results
 */
async function validateDocumentAuthenticity(imageBuffer) {
  try {
    if (!documentValidationModel || !featureExtractionModel) {
      throw new Error('Document validation models not initialized');
    }

    // Extract features first
    const featuresResult = await extractDocumentFeatures(imageBuffer);
    if (!featuresResult.success) {
      return featuresResult;
    }

    // Convert features to tensor
    const featureTensor = tf.tensor2d([featuresResult.visualFeatures]);

    // Make validation prediction
    const prediction = documentValidationModel.predict(featureTensor);
    const probabilities = await prediction.data();

    const authenticProbability = probabilities[1]; // Index 1 for authentic
    const isAuthentic = authenticProbability > 0.5;

    // Clean up tensors
    featureTensor.dispose();
    prediction.dispose();

    return {
      success: true,
      isAuthentic: isAuthentic,
      confidence: authenticProbability,
      authenticity_score: authenticProbability,
      risk_factors: analyzeRiskFactors(featuresResult)
    };
  } catch (error) {
    console.error('Error validating document authenticity:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Analyze risk factors in document features
 * @param {Object} features - Extracted document features
 * @returns {Array} - List of risk factors
 */
function analyzeRiskFactors(features) {
  const riskFactors = [];

  // Check layout features
  if (features.layoutFeatures) {
    if (features.layoutFeatures.brightness < 50) {
      riskFactors.push('Image too dark');
    }
    if (features.layoutFeatures.brightness > 200) {
      riskFactors.push('Image overexposed');
    }
    if (features.layoutFeatures.contrast < 20) {
      riskFactors.push('Low contrast');
    }
    if (features.layoutFeatures.textDensity < 0.01) {
      riskFactors.push('Very low text density');
    }
  }

  // Check text features
  if (features.textFeatures) {
    if (features.textFeatures.wordCount < 10) {
      riskFactors.push('Insufficient text content');
    }
    if (!features.textFeatures.hasGovernmentKeywords) {
      riskFactors.push('Missing government identifiers');
    }
  }

  return riskFactors;
}

/**
 * Prepare training data from uploaded documents
 * @param {Array} trainingFiles - Array of training file objects
 * @returns {Promise<Object>} - Prepared training data
 */
async function prepareTrainingData(trainingFiles) {
  try {
    const images = [];
    const labels = [];

    for (const file of trainingFiles) {
      // Preprocess image
      const imageBuffer = fs.readFileSync(file.path);
      const preprocessedImage = await preprocessImage(imageBuffer);

      // Convert to array and add to training data
      const imageArray = await preprocessedImage.data();
      images.push(Array.from(imageArray));

      // Create one-hot encoded label
      const labelIndex = Object.values(DOCUMENT_TYPES).indexOf(file.documentType);
      const oneHotLabel = new Array(TRAINING_CONFIG.numClasses).fill(0);
      oneHotLabel[labelIndex] = 1;
      labels.push(oneHotLabel);

      // Clean up tensor
      preprocessedImage.dispose();
    }

    return {
      success: true,
      images: images,
      labels: labels,
      sampleCount: images.length
    };
  } catch (error) {
    console.error('Error preparing training data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Train the document classification model with new data
 * @param {Array} trainingFiles - Array of training file objects
 * @param {Object} options - Training options
 * @returns {Promise<Object>} - Training results
 */
async function trainDocumentClassificationModel(trainingFiles, options = {}) {
  try {
    if (!documentClassificationModel) {
      throw new Error('Document classification model not initialized');
    }

    console.log(`Starting training with ${trainingFiles.length} samples...`);

    // Prepare training data
    const trainingData = await prepareTrainingData(trainingFiles);
    if (!trainingData.success) {
      return trainingData;
    }

    // Convert to tensors
    const imageShape = [trainingData.sampleCount, ...TRAINING_CONFIG.imageSize, 3];
    const xs = tf.tensor4d(trainingData.images, imageShape);
    const ys = tf.tensor2d(trainingData.labels);

    // Training configuration
    const trainingOptions = {
      epochs: options.epochs || TRAINING_CONFIG.epochs,
      batchSize: options.batchSize || TRAINING_CONFIG.batchSize,
      validationSplit: options.validationSplit || TRAINING_CONFIG.validationSplit,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
        }
      }
    };

    // Train the model
    const history = await documentClassificationModel.fit(xs, ys, trainingOptions);

    // Save the trained model
    const modelSavePath = path.join(MODELS_PATH, 'classification');
    if (!fs.existsSync(modelSavePath)) {
      fs.mkdirSync(modelSavePath, { recursive: true });
    }

    await documentClassificationModel.save(`file://${modelSavePath}`);

    // Clean up tensors
    xs.dispose();
    ys.dispose();

    return {
      success: true,
      trainingHistory: history.history,
      modelSaved: true,
      trainingStats: {
        samples: trainingData.sampleCount,
        epochs: trainingOptions.epochs,
        finalLoss: history.history.loss[history.history.loss.length - 1],
        finalAccuracy: history.history.acc[history.history.acc.length - 1]
      }
    };
  } catch (error) {
    console.error('Error training document classification model:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  DOCUMENT_TYPES,
  TRAINING_CONFIG,
  initializeDocumentClassification,
  loadOrCreateModels,
  createDocumentClassificationModel,
  createFeatureExtractionModel,
  createDocumentValidationModel,
  preprocessImage,
  classifyDocument,
  extractDocumentFeatures,
  extractTextFeatures,
  extractLayoutFeatures,
  analyzeTextPatterns,
  validateDocumentAuthenticity,
  analyzeRiskFactors,
  prepareTrainingData,
  trainDocumentClassificationModel
};
