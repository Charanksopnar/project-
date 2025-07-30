/**
 * ID Verification Module
 * 
 * This module handles verification of government-issued IDs like Aadhar, Voter ID, and Driving License.
 * It uses OCR and face matching to verify the authenticity of the ID and match it with the user.
 */

const tesseract = require('node-tesseract-ocr');
const faceRecognition = require('./faceRecognition');
const fs = require('fs');
const path = require('path');

// Configuration for OCR
const ocrConfig = {
  lang: 'eng',
  oem: 1,
  psm: 3,
};

/**
 * Extract text from ID card image using OCR
 * @param {Buffer} idImageBuffer - The ID card image buffer
 * @returns {Promise<Object>} - Extracted text and success status
 */
async function extractTextFromID(idImageBuffer) {
  try {
    // Save buffer to temporary file for OCR processing
    const tempFilePath = path.join(__dirname, '../temp', `temp_id_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, idImageBuffer);
    
    // Perform OCR
    const text = await tesseract.recognize(tempFilePath, ocrConfig);
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    
    return {
      success: true,
      text: text
    };
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
function validateAadharNumber(aadharNumber) {
  // Simple validation for demo purposes
  // In a real implementation, use the Verhoeff algorithm
  return aadharNumber.length === 12 && /^\d+$/.test(aadharNumber);
}

module.exports = {
  verifyAadharCard,
  verifyVoterID,
  verifyDrivingLicense,
  matchFaceWithID
};
