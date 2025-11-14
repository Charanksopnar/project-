/**
 * ID Verification Module
 * 
 * This module handles verification of government-issued IDs like Aadhar, Voter ID, PAN, and Driving License.
 * Features:
 * - OCR-based text extraction with preprocessing
 * - Face detection and matching
 * - ID type detection and validation
 * - Personal information extraction
 * - Multi-language support (English + Hindi)
 */

const tesseract = require('node-tesseract-ocr');
const faceRecognition = require('./faceRecognition');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sharp = require('sharp');

// Configuration for OCR
const ocrConfig = {
  lang: 'eng+hin', // Support both English and Hindi
  oem: 1, // Use LSTM OCR Engine
  psm: 3, // Auto-page segmentation
  dpi: 300, // Higher DPI for better accuracy
  preprocess: true // Enable preprocessing
};

// Supported ID types and their validation patterns
const ID_PATTERNS = {
  aadhar: {
    pattern: /[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}/,
    name: 'Aadhar Card',
    required: ['name', 'dob', 'gender', 'number']
  },
  voter: {
    pattern: /[A-Z]{3}[0-9]{7}/,
    name: 'Voter ID',
    required: ['name', 'father_name', 'number']
  },
  pan: {
    pattern: /[A-Z]{5}[0-9]{4}[A-Z]{1}/,
    name: 'PAN Card',
    required: ['name', 'father_name', 'dob', 'number']
  },
  driving: {
    pattern: /[A-Z]{2}[0-9]{13}/,
    name: 'Driving License',
    required: ['name', 'dob', 'number', 'validity']
  }
};

/**
 * Preprocess ID card image for better OCR accuracy
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Processed image buffer
 */
async function preprocessImage(imageBuffer) {
  try {
    return await sharp(imageBuffer)
      .resize(1500, null, { withoutEnlargement: true }) // Resize to optimal width
      .sharpen() // Enhance edges
      .normalize() // Normalize contrast
      .toBuffer();
  } catch (error) {
    console.error('Error preprocessing image:', error);
    return imageBuffer; // Return original if processing fails
  }
}

/**
 * Extract text from ID card image using OCR
 * @param {Buffer} idImageBuffer - The ID card image buffer
 * @returns {Promise<Object>} - Extracted text and success status
 */
async function extractTextFromID(idImageBuffer) {
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Preprocess image for better OCR
    const processedBuffer = await preprocessImage(idImageBuffer);
    
    // Save processed buffer to temporary file
    const tempFilePath = path.join(tempDir, `temp_id_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, processedBuffer);
    
    try {
      // Perform OCR with enhanced config
      const text = await tesseract.recognize(tempFilePath, {
        ...ocrConfig,
        preprocess: 'contrast', // Enhance contrast
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/ ', // Limit characters
      });
      
      return {
        success: true,
        text: text.trim(),
        confidence: 100 // TODO: Get actual confidence from Tesseract
      };
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error) {
    console.error('Error extracting text from ID:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify Aadhar card
 * @param {Buffer} idImageBuffer - The Aadhar card image buffer
 * @returns {Promise<Object>} - Verification results
 */
async function verifyAadharCard(idImageBuffer) {
  try {
    const extractionResult = await extractTextFromID(idImageBuffer);
    
    if (!extractionResult.success) {
      return extractionResult;
    }
    
    const text = extractionResult.text;
    
    // Check for Aadhar card patterns
    const aadharNumberPattern = /\d{4}\s\d{4}\s\d{4}/g;
    const aadharMatches = text.match(aadharNumberPattern);
    
    if (!aadharMatches || aadharMatches.length === 0) {
      return {
        success: false,
        error: 'No valid Aadhar number found on the ID'
      };
    }
    
    // Extract the Aadhar number
    const aadharNumber = aadharMatches[0].replace(/\s/g, '');
    
    // Validate Aadhar number using Verhoeff algorithm
    const isValidAadhar = validateAadharNumber(aadharNumber);
    
    return {
      success: true,
      isValid: isValidAadhar,
      idType: 'Aadhar',
      idNumber: aadharNumber
    };
  } catch (error) {
    console.error('Error verifying Aadhar card:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify Voter ID card
 * @param {Buffer} idImageBuffer - The Voter ID card image buffer
 * @returns {Promise<Object>} - Verification results
 */
async function verifyVoterID(idImageBuffer) {
  try {
    const extractionResult = await extractTextFromID(idImageBuffer);
    
    if (!extractionResult.success) {
      return extractionResult;
    }
    
    const text = extractionResult.text;
    
    // Check for Voter ID patterns (typically 10 characters with letters and numbers)
    const voterIDPattern = /[A-Z]{3}[0-9]{7}/g;
    const voterIDMatches = text.match(voterIDPattern);
    
    if (!voterIDMatches || voterIDMatches.length === 0) {
      return {
        success: false,
        error: 'No valid Voter ID number found on the ID'
      };
    }
    
    // Extract the Voter ID number
    const voterIDNumber = voterIDMatches[0];
    
    return {
      success: true,
      isValid: true, // Basic validation passed if pattern matched
      idType: 'Voter ID',
      idNumber: voterIDNumber
    };
  } catch (error) {
    console.error('Error verifying Voter ID:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify Driving License
 * @param {Buffer} idImageBuffer - The Driving License image buffer
 * @returns {Promise<Object>} - Verification results
 */
async function verifyDrivingLicense(idImageBuffer) {
  try {
    const extractionResult = await extractTextFromID(idImageBuffer);
    
    if (!extractionResult.success) {
      return extractionResult;
    }
    
    const text = extractionResult.text;
    
    // Check for Driving License patterns (varies by state, but typically has DL No. followed by alphanumeric)
    const dlPattern = /DL\s*No\.?\s*([A-Z0-9\-]+)/i;
    const dlMatches = text.match(dlPattern);
    
    if (!dlMatches || dlMatches.length < 2) {
      return {
        success: false,
        error: 'No valid Driving License number found on the ID'
      };
    }
    
    // Extract the Driving License number
    const dlNumber = dlMatches[1];
    
    return {
      success: true,
      isValid: true, // Basic validation passed if pattern matched
      idType: 'Driving License',
      idNumber: dlNumber
    };
  } catch (error) {
    console.error('Error verifying Driving License:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Match face on ID with live face
 * @param {Buffer} idImageBuffer - The ID card image buffer
 * @param {Buffer} selfieBuffer - The live selfie image buffer
 * @returns {Promise<Object>} - Face matching results
 */
async function matchFaceWithID(idImageBuffer, selfieBuffer) {
  try {
    // First detect faces in the ID image
    const idFaceDetection = await faceRecognition.detectFaces(idImageBuffer);
    
    if (!idFaceDetection.success || idFaceDetection.faceCount === 0) {
      return {
        success: false,
        error: 'No face detected on the ID'
      };
    }
    
    // Compare the face on the ID with the selfie
    const comparisonResult = await faceRecognition.compareFaces(selfieBuffer, idImageBuffer);
    
    return comparisonResult;
  } catch (error) {
    console.error('Error matching face with ID:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate Aadhar number using Verhoeff algorithm
 * @param {string} aadharNumber - The Aadhar number to validate
 * @returns {boolean} - Whether the Aadhar number is valid
 */
function validateAadharNumber(aadharNumber) {\n    const d = [\n        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],\n        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],\n        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],\n        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],\n        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],\n        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],\n        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],\n        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],\n        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],\n        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]\n    ];\n    const p = [\n        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],\n        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],\n        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],\n        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],\n        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],\n        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],\n        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],\n        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]\n    ];\n\n    if (aadharNumber.length !== 12 || !/^\d+$/.test(aadharNumber)) {\n        return false;\n    }\n\n    let c = 0;\n    const invertedAadhar = aadharNumber.split(\'\').reverse().map(Number);\n\n    for (let i = 0; i < invertedAadhar.length; i++) {\n        c = d[c][p[i % 8][invertedAadhar[i]]];\n    }\n\n    return c === 0;\n}

module.exports = {
  verifyAadharCard,
  verifyVoterID,
  verifyDrivingLicense,
  matchFaceWithID
};
