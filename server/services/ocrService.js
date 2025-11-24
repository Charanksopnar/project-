/**
 * OCR Service - Tesseract.js Integration
 * Extracts Aadhaar and Voter ID numbers from ID documents
 */

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Preprocess image for better OCR accuracy
 */
async function preprocessImage(imagePath) {
    try {
        const processedPath = imagePath.replace(path.extname(imagePath), '_processed.jpg');

        await sharp(imagePath)
            .resize(2000, null, { // Resize to optimal width
                fit: 'inside',
                withoutEnlargement: true
            })
            .greyscale() // Convert to grayscale
            .normalize() // Normalize contrast
            .sharpen() // Sharpen edges
            .toFile(processedPath);

        return processedPath;
    } catch (error) {
        console.error('Image preprocessing error:', error);
        return imagePath; // Return original if preprocessing fails
    }
}

/**
 * Extract text from image using Tesseract.js
 */
async function extractTextFromImage(imagePath) {
    try {
        console.log('Starting OCR extraction...');

        // Preprocess image
        const processedPath = await preprocessImage(imagePath);

        // Perform OCR
        const { data: { text, confidence } } = await Tesseract.recognize(
            processedPath,
            'eng',
            {
                logger: info => {
                    if (info.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
                    }
                }
            }
        );

        // Clean up processed image
        if (processedPath !== imagePath && fs.existsSync(processedPath)) {
            fs.unlinkSync(processedPath);
        }

        console.log('OCR extraction completed');

        return {
            success: true,
            text: text,
            confidence: Math.round(confidence)
        };
    } catch (error) {
        console.error('OCR extraction error:', error);
        return {
            success: false,
            text: '',
            confidence: 0,
            error: error.message
        };
    }
}

/**
 * Extract Aadhaar number from text
 * Format: 12 digits, may have spaces (XXXX XXXX XXXX)
 */
function extractAadhaarNumber(text) {
    // Remove all whitespace and newlines
    const cleanText = text.replace(/\s+/g, ' ');

    // Patterns to match Aadhaar numbers
    const patterns = [
        /(\d{4}\s\d{4}\s\d{4})/g, // Format: XXXX XXXX XXXX
        /(\d{12})/g, // Format: XXXXXXXXXXXX
        /Aadhaar\s*(?:Number|No\.?)?\s*:?\s*(\d{4}\s\d{4}\s\d{4})/gi,
        /Aadhaar\s*(?:Number|No\.?)?\s*:?\s*(\d{12})/gi
    ];

    for (const pattern of patterns) {
        const matches = cleanText.match(pattern);
        if (matches) {
            for (const match of matches) {
                const digits = match.replace(/\D/g, ''); // Remove non-digits
                if (digits.length === 12 && /^\d{12}$/.test(digits)) {
                    return {
                        found: true,
                        number: digits,
                        formatted: `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`,
                        confidence: 90
                    };
                }
            }
        }
    }

    return {
        found: false,
        number: null,
        formatted: null,
        confidence: 0
    };
}

/**
 * Extract Voter ID number from text
 * Format: 3 letters followed by 7 digits (ABC1234567)
 */
function extractVoterIdNumber(text) {
    // Remove all whitespace
    const cleanText = text.replace(/\s+/g, '');

    // Patterns to match Voter ID
    const patterns = [
        /([A-Z]{3}\d{7})/g,
        /Voter\s*ID\s*:?\s*([A-Z]{3}\d{7})/gi,
        /EPIC\s*(?:No\.?)?\s*:?\s*([A-Z]{3}\d{7})/gi
    ];

    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                const voterId = match.replace(/[^A-Z0-9]/g, ''); // Keep only letters and digits
                if (/^[A-Z]{3}\d{7}$/.test(voterId)) {
                    return {
                        found: true,
                        number: voterId,
                        confidence: 85
                    };
                }
            }
        }
    }

    return {
        found: false,
        number: null,
        confidence: 0
    };
}

/**
 * Main OCR extraction function
 * Extracts both Aadhaar and Voter ID numbers
 */
async function extractIdNumbers(imagePath) {
    try {
        // Extract text using OCR
        const ocrResult = await extractTextFromImage(imagePath);

        if (!ocrResult.success) {
            return {
                success: false,
                error: ocrResult.error || 'OCR failed',
                aadhaar: { found: false, number: null },
                voterId: { found: false, number: null }
            };
        }

        // Extract Aadhaar number
        const aadhaar = extractAadhaarNumber(ocrResult.text);

        // Extract Voter ID number
        const voterId = extractVoterIdNumber(ocrResult.text);

        return {
            success: true,
            ocrConfidence: ocrResult.confidence,
            extractedText: ocrResult.text.substring(0, 500), // First 500 chars for logging
            aadhaar: aadhaar,
            voterId: voterId
        };
    } catch (error) {
        console.error('ID number extraction error:', error);
        return {
            success: false,
            error: error.message,
            aadhaar: { found: false, number: null },
            voterId: { found: false, number: null }
        };
    }
}

module.exports = {
    extractTextFromImage,
    extractIdNumbers,
    extractAadhaarNumber,
    extractVoterIdNumber,
    preprocessImage
};
