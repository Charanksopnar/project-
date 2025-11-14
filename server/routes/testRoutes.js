const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const idVerification = require('../biometrics/idVerification');
const faceComparison = require('../biometrics/faceComparison');
const { upload } = require('../middleware/upload');

// Test route for ID verification
router.get('/test-verification', async (req, res) => {
    try {
        // Path to a sample ID image in the uploads folder
        const sampleIdPath = path.join(__dirname, '../uploads/idProofs/sample-id.jpg');
        
        // Check if sample image exists
        if (!fs.existsSync(sampleIdPath)) {
            return res.status(404).json({
                success: false,
                message: 'Sample ID image not found. Please upload a test image first.'
            });
        }

        // Read the sample image
        const idBuffer = fs.readFileSync(sampleIdPath);

        // Test ID verification
        console.log('Testing ID verification...');
        const verificationResult = await idVerification.verifyID(idBuffer);

        // Return the results
        res.json({
            success: true,
            message: 'ID verification test completed',
            result: verificationResult,
            ocrSupported: true,
            modelLoaded: true
        });

    } catch (error) {
        console.error('Test verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during test verification',
            error: error.message
        });
    }
});

// Test OCR capabilities
router.get('/test-ocr', async (req, res) => {
    try {
        const sampleText = path.join(__dirname, '../uploads/idProofs/sample-text.jpg');
        
        if (!fs.existsSync(sampleText)) {
            return res.status(404).json({
                success: false,
                message: 'Sample text image not found. Please upload a test image first.'
            });
        }

        const textBuffer = fs.readFileSync(sampleText);
        const extractionResult = await idVerification.extractTextFromID(textBuffer);

        res.json({
            success: true,
            message: 'OCR test completed',
            result: extractionResult
        });

    } catch (error) {
        console.error('OCR test error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during OCR test',
            error: error.message
        });
    }
});

// Get supported ID types and patterns
router.get('/supported-ids', (req, res) => {
    res.json({
        success: true,
        supportedIds: idVerification.ID_PATTERNS,
        message: 'List of supported ID types and their validation patterns'
    });
});

// Test route for face comparison with live file upload
router.post('/compare-faces', upload.fields([
    { name: 'selfie', maxCount: 1 },
    { name: 'idPhoto', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files?.selfie?.[0] || !req.files?.idPhoto?.[0]) {
            return res.status(400).json({ 
                success: false,
                error: 'Both selfie and ID photo are required' 
            });
        }

        const selfieBuffer = fs.readFileSync(req.files.selfie[0].path);
        const idPhotoBuffer = fs.readFileSync(req.files.idPhoto[0].path);

        console.log('Testing face comparison...');
        const comparisonResult = await faceComparison.compareFaces(selfieBuffer, idPhotoBuffer);

        // Clean up uploaded files
        fs.unlinkSync(req.files.selfie[0].path);
        fs.unlinkSync(req.files.idPhoto[0].path);

        res.json({
            success: true,
            message: 'Face comparison test completed',
            result: comparisonResult
        });
    } catch (error) {
        console.error('Face comparison test error:', error);

        // Clean up files in case of error
        try {
            if (req.files?.selfie?.[0]?.path) fs.unlinkSync(req.files.selfie[0].path);
            if (req.files?.idPhoto?.[0]?.path) fs.unlinkSync(req.files.idPhoto[0].path);
        } catch (cleanupError) {
            console.error('Error cleaning up files:', cleanupError);
        }

        res.status(500).json({
            success: false,
            message: 'Error during face comparison test',
            error: error.message
        });
    }
});

module.exports = router;