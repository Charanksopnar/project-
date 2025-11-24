/**
 * Enhanced ID Verification Module - Fast Mock Implementation
 * 
 * This is a simplified version that demonstrates field extraction
 * without the slow Tesseract.js OCR processing.
 * 
 * Features:
 * - Fast response (1-2 seconds)
 * - Demonstrates field extraction (Name, DOB, Address, ID Number)
 * - Verhoeff algorithm validation for Aadhar
 * - Age verification
 * - Confidence scoring
 */

const sharp = require('sharp');

// Confidence threshold for auto-approval
const CONFIDENCE_THRESHOLD = 70;

/**
 * Mock OCR - Returns sample extracted data based on ID type
 * In production, this would use Tesseract.js or Google Vision API
 */
async function mockOCRExtraction(idType) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (idType === 'aadhar') {
    return {
      success: true,
      text: `GOVERNMENT OF INDIA
Name: Rajesh Kumar Sharma
DOB: 15/03/1995
Gender: Male
Address: House No 123, Sector 45, Gurgaon, Haryana - 122001
Address: House No 123, Sector 45, Gurgaon, Haryana - 122001
Aadhar Number: 3675 9834 6012`,
      confidence: 85
    };
  } else if (idType === 'voter') {
    return {
      success: true,
      text: `ELECTION COMMISSION OF INDIA
Name: Priya Singh
Father's Name: Ramesh Singh
DOB: 22/07/1998
Address: Flat 456, Green Park, New Delhi - 110016
Voter ID: ABC1234567`,
      confidence: 82
    };
  }

  return {
    success: false,
    error: 'Unsupported ID type',
    text: '',
    confidence: 0
  };
}

/**
 * Extract name from OCR text
 */
function extractName(text) {
  const namePatterns = [
    /Name[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i,
    /(?:Name|नाम)[:\s]*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return {
        value: match[1].trim(),
        confidence: 90
      };
    }
  }

  return { value: null, confidence: 0 };
}

/**
 * Extract date of birth and calculate age
 */
function extractDOB(text) {
  const dobPatterns = [
    /(?:DOB|Date of Birth)[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
    /(\d{2}[-\/]\d{2}[-\/]\d{4})/
  ];

  for (const pattern of dobPatterns) {
    const match = text.match(pattern);
    if (match) {
      const dobString = match[1];
      const age = calculateAge(dobString);

      if (age >= 18 && age <= 120) {
        return {
          value: dobString,
          age: age,
          isAdult: age >= 18,
          confidence: 85
        };
      }
    }
  }

  return { value: null, age: null, isAdult: false, confidence: 0 };
}

/**
 * Calculate age from date string
 */
function calculateAge(dobString) {
  try {
    const parts = dobString.split(/[-\/]/);
    let day, month, year;

    if (parts[0].length === 2) {
      [day, month, year] = parts;
    } else {
      [year, month, day] = parts;
    }

    const dob = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    return 0;
  }
}

/**
 * Extract address from text
 */
function extractAddress(text) {
  const addressPatterns = [
    /Address[:\s]*(.+?)(?:\n|Aadhar|Voter)/i,
    /(?:S\/O|D\/O|C\/O)[:\s]*(.+?)(?:\n|$)/i
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 10) {
      return {
        value: match[1].trim(),
        confidence: 75
      };
    }
  }

  return { value: null, confidence: 0 };
}

/**
 * Extract gender from text
 */
function extractGender(text) {
  const genderPattern = /Gender[:\s]*(Male|Female|M|F)/i;
  const match = text.match(genderPattern);

  if (match) {
    const gender = match[1].toUpperCase();
    if (gender.startsWith('M')) {
      return { value: 'Male', confidence: 90 };
    } else if (gender.startsWith('F')) {
      return { value: 'Female', confidence: 90 };
    }
  }

  return { value: null, confidence: 0 };
}

/**
 * Extract and validate Aadhar number
 */
function extractAadharNumber(text) {
  const patterns = [
    /(\d{4}\s\d{4}\s\d{4})/,
    /(\d{12})/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const aadharNumber = match[1].replace(/\s/g, '');
      if (aadharNumber.length === 12 && validateAadharNumber(aadharNumber)) {
        return {
          value: aadharNumber,
          formatted: `${aadharNumber.slice(0, 4)} ${aadharNumber.slice(4, 8)} ${aadharNumber.slice(8)}`,
          isValid: true,
          confidence: 95
        };
      }
    }
  }

  return { value: null, formatted: null, isValid: false, confidence: 0 };
}

/**
 * Validate Aadhar number using Verhoeff algorithm
 */
function validateAadharNumber(aadharNumber) {
  if (!/^\d{12}$/.test(aadharNumber)) return false;

  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ];

  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ];

  let c = 0;
  const reversedDigits = aadharNumber.split('').reverse();

  for (let i = 0; i < reversedDigits.length; i++) {
    c = d[c][p[i % 8][parseInt(reversedDigits[i])]];
  }

  return c === 0;
}

/**
 * Extract and validate Voter ID number
 */
function extractVoterID(text) {
  const pattern = /\b([A-Z]{3}\d{7})\b/;
  const match = text.match(pattern);

  if (match) {
    return {
      value: match[1],
      isValid: true,
      confidence: 90
    };
  }

  return { value: null, isValid: false, confidence: 0 };
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(extractedData, ocrConfidence) {
  let totalScore = 0;
  let maxScore = 0;

  // OCR confidence (30%)
  totalScore += (ocrConfidence || 0) * 0.3;
  maxScore += 30;

  // ID Number (30%)
  if (extractedData.idNumber && extractedData.idNumber.isValid) {
    totalScore += extractedData.idNumber.confidence * 0.3;
  }
  maxScore += 30;

  // Name (15%)
  if (extractedData.name && extractedData.name.value) {
    totalScore += extractedData.name.confidence * 0.15;
  }
  maxScore += 15;

  // DOB (15%)
  if (extractedData.dob && extractedData.dob.value && extractedData.dob.isAdult) {
    totalScore += extractedData.dob.confidence * 0.15;
  }
  maxScore += 15;

  // Address (10%)
  if (extractedData.address && extractedData.address.value) {
    totalScore += extractedData.address.confidence * 0.1;
  }
  maxScore += 10;

  return Math.round((totalScore / maxScore) * 100);
}

/**
 * Verify Aadhar Card with field extraction
 */
async function verifyAadharCard(idImageBuffer) {
  try {
    console.log('Starting Aadhar verification (Mock OCR)...');

    const ocrResult = await mockOCRExtraction('aadhar');

    if (!ocrResult.success) {
      return {
        success: false,
        isValid: false,
        error: ocrResult.error || 'OCR failed',
        idType: 'Aadhar',
        confidence: 0
      };
    }

    const text = ocrResult.text;
    console.log('Extracted text (first 200 chars):', text.substring(0, 200));

    // Extract all fields
    const extractedData = {
      name: extractName(text),
      dob: extractDOB(text),
      gender: extractGender(text),
      address: extractAddress(text),
      idNumber: extractAadharNumber(text)
    };

    // Calculate confidence
    const overallConfidence = calculateOverallConfidence(extractedData, ocrResult.confidence);

    // Determine if valid
    const isValid = extractedData.idNumber.isValid &&
      extractedData.dob.isAdult &&
      overallConfidence >= CONFIDENCE_THRESHOLD;

    return {
      success: true,
      isValid: isValid,
      idType: 'Aadhar',
      idNumber: extractedData.idNumber.value || 'Not found',
      confidence: overallConfidence,
      extractedFields: {
        name: extractedData.name.value,
        dob: extractedData.dob.value,
        age: extractedData.dob.age,
        gender: extractedData.gender.value,
        address: extractedData.address.value,
        idNumber: extractedData.idNumber.formatted || extractedData.idNumber.value
      },
      fieldConfidence: {
        name: extractedData.name.confidence,
        dob: extractedData.dob.confidence,
        gender: extractedData.gender.confidence,
        address: extractedData.address.confidence,
        idNumber: extractedData.idNumber.confidence
      },
      needsManualReview: overallConfidence < CONFIDENCE_THRESHOLD,
      ocrConfidence: ocrResult.confidence
    };
  } catch (error) {
    console.error('Aadhar verification error:', error);
    return {
      success: false,
      isValid: false,
      error: error.message,
      idType: 'Aadhar',
      confidence: 0
    };
  }
}

/**
 * Verify Voter ID with field extraction
 */
async function verifyVoterID(idImageBuffer) {
  try {
    console.log('Starting Voter ID verification (Mock OCR)...');

    const ocrResult = await mockOCRExtraction('voter');

    if (!ocrResult.success) {
      return {
        success: false,
        isValid: false,
        error: ocrResult.error || 'OCR failed',
        idType: 'Voter ID',
        confidence: 0
      };
    }

    const text = ocrResult.text;
    console.log('Extracted text (first 200 chars):', text.substring(0, 200));

    // Extract all fields
    const extractedData = {
      name: extractName(text),
      dob: extractDOB(text),
      address: extractAddress(text),
      idNumber: extractVoterID(text)
    };

    // Calculate confidence
    const overallConfidence = calculateOverallConfidence(extractedData, ocrResult.confidence);

    // Determine if valid
    const isValid = extractedData.idNumber.isValid &&
      extractedData.dob.isAdult &&
      overallConfidence >= CONFIDENCE_THRESHOLD;

    return {
      success: true,
      isValid: isValid,
      idType: 'Voter ID',
      idNumber: extractedData.idNumber.value || 'Not found',
      confidence: overallConfidence,
      extractedFields: {
        name: extractedData.name.value,
        dob: extractedData.dob.value,
        age: extractedData.dob.age,
        address: extractedData.address.value,
        idNumber: extractedData.idNumber.value
      },
      fieldConfidence: {
        name: extractedData.name.confidence,
        dob: extractedData.dob.confidence,
        address: extractedData.address.confidence,
        idNumber: extractedData.idNumber.confidence
      },
      needsManualReview: overallConfidence < CONFIDENCE_THRESHOLD,
      ocrConfidence: ocrResult.confidence
    };
  } catch (error) {
    console.error('Voter ID verification error:', error);
    return {
      success: false,
      isValid: false,
      error: error.message,
      idType: 'Voter ID',
      confidence: 0
    };
  }
}

// Placeholder for face matching - MOCK IMPLEMENTATION
async function matchFaceWithID(idImageBuffer, selfieBuffer) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    performed: true,
    isMatch: true,
    confidence: 95 // High confidence for mock to ensure verification passes
  };
}

module.exports = {
  verifyAadharCard,
  verifyVoterID,
  matchFaceWithID,
  calculateAge
};
