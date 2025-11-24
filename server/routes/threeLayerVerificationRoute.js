/**
 * 3-Layer ID Verification Endpoint
 * 
 * This endpoint implements a comprehensive 3-layer verification system:
 * Layer 1: OCR-based ID number matching
 * Layer 2: Image similarity comparison (SHA-256 + pHash)
 * Layer 3: Admin manual review (creates verification case)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const mockDb = require('../mockDb');
const ocrService = require('../services/ocrService');
const imageComparisonService = require('../services/imageComparisonService');
const verificationCaseService = require('../services/verificationCaseService');
const errorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

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
 * @route POST /api/security/verify-id-step2
 * @desc Verify ID document in Step 2 using 3-layer verification
 * @access Private
 */
router.post(
    '/verify-id-step2',
    upload.single('idImage'),
    errorHandler.catchAsync(async (req, res) => {
        const { voterId } = req.body;

        if (!voterId) {
            throw new errorHandler.ValidationError('Voter ID is required');
        }

        if (!req.file) {
            throw new errorHandler.ValidationError('ID image is required');
        }

        // Get voter from database
        const voter = mockDb.voters.find(v => v._id === voterId);
        if (!voter) {
            throw new errorHandler.NotFoundError('Voter not found');
        }

        // Check if voter has original ID document from registration (Step 1)
        if (!voter.kycDocuments || !voter.kycDocuments.idDocument) {
            throw new errorHandler.ValidationError('No original ID document found. Please complete registration first.');
        }

        const step2ImagePath = req.file.path;
        const originalImagePath = path.join(__dirname, '../uploads/', voter.kycDocuments.idDocument.filename);

        if (!fs.existsSync(originalImagePath)) {
            throw new errorHandler.ValidationError('Original ID document file not found');
        }

        logger.info(`Starting 3-layer verification for voter ${voterId}`);

        // ============================================
        // LAYER 1: OCR-BASED VERIFICATION
        // ============================================
        logger.info('Layer 1: OCR-based verification...');

        let ocrLayer1Result = null;
        let ocrLayer2Result = null;
        let ocrMatched = false;

        try {
            // Extract ID numbers from Step 1 (original) document
            logger.info('Extracting ID numbers from original document...');
            ocrLayer1Result = await ocrService.extractIdNumbers(originalImagePath);

            // Extract ID numbers from Step 2 (new) document
            logger.info('Extracting ID numbers from new document...');
            ocrLayer2Result = await ocrService.extractIdNumbers(step2ImagePath);

            // Compare extracted ID numbers
            if (ocrLayer1Result.success && ocrLayer2Result.success) {
                // Check Aadhaar match
                if (ocrLayer1Result.aadhaar.found && ocrLayer2Result.aadhaar.found) {
                    if (ocrLayer1Result.aadhaar.number === ocrLayer2Result.aadhaar.number) {
                        ocrMatched = true;
                        logger.info(`✓ Layer 1 PASSED: Aadhaar numbers match (${ocrLayer1Result.aadhaar.number})`);
                    }
                }

                // Check Voter ID match
                if (!ocrMatched && ocrLayer1Result.voterId.found && ocrLayer2Result.voterId.found) {
                    if (ocrLayer1Result.voterId.number === ocrLayer2Result.voterId.number) {
                        ocrMatched = true;
                        logger.info(`✓ Layer 1 PASSED: Voter ID numbers match (${ocrLayer1Result.voterId.number})`);
                    }
                }
            }
        } catch (error) {
            logger.error('OCR extraction error:', error);
            // Continue to Layer 2 even if OCR fails
        }

        // If OCR matched, auto-verify
        if (ocrMatched) {
            voter.verificationStatus = 'verified';
            voter.verified = true;
            voter.kycApprovedAt = new Date();
            voter.kycApprovedBy = 'system_ocr';

            logger.info(`✓ Voter ${voterId} auto-verified via OCR match`);

            return res.json({
                success: true,
                verified: true,
                method: 'OCR',
                layer: 1,
                message: 'ID verified successfully via OCR matching',
                details: {
                    ocrMatched: true,
                    aadhaarMatch: ocrLayer1Result?.aadhaar.found && ocrLayer2Result?.aadhaar.found,
                    voterIdMatch: ocrLayer1Result?.voterId.found && ocrLayer2Result?.voterId.found
                }
            });
        }

        logger.info('✗ Layer 1 FAILED: OCR numbers do not match or extraction failed');

        // ============================================
        // LAYER 2: IMAGE COMPARISON
        // ============================================
        logger.info('Layer 2: Image comparison...');

        const imageComparisonResult = await imageComparisonService.compareImages(
            originalImagePath,
            step2ImagePath,
            { pHashThreshold: 90 }
        );

        if (imageComparisonResult.matched) {
            voter.verificationStatus = 'verified';
            voter.verified = true;
            voter.kycApprovedAt = new Date();
            voter.kycApprovedBy = `system_${imageComparisonResult.matchMethod.toLowerCase()}`;

            logger.info(`✓ Voter ${voterId} auto-verified via ${imageComparisonResult.matchMethod} (similarity: ${imageComparisonResult.similarity}%)`);

            return res.json({
                success: true,
                verified: true,
                method: imageComparisonResult.matchMethod,
                layer: 2,
                message: `ID verified successfully via ${imageComparisonResult.matchMethod} matching`,
                details: {
                    similarity: imageComparisonResult.similarity,
                    sha256Match: imageComparisonResult.sha256?.isIdentical || false,
                    pHashSimilarity: imageComparisonResult.pHash?.similarity || 0
                }
            });
        }

        logger.info(`✗ Layer 2 FAILED: Image similarity too low (${imageComparisonResult.similarity}%)`);

        // ============================================
        // LAYER 3: ADMIN MANUAL REVIEW
        // ============================================
        logger.info('Layer 3: Creating admin review case...');

        // Create verification case for admin review
        const verificationCase = verificationCaseService.createVerificationCase(mockDb, {
            voterId: voterId,
            originalIdDocument: {
                filename: voter.kycDocuments.idDocument.filename,
                path: originalImagePath,
                uploadedAt: voter.kycDocuments.idDocument.uploadedAt
            },
            step2IdDocument: {
                filename: req.file.filename,
                path: step2ImagePath
            },
            ocrResults: {
                step1: {
                    aadhaar: ocrLayer1Result?.aadhaar.number || null,
                    voterId: ocrLayer1Result?.voterId.number || null
                },
                step2: {
                    aadhaar: ocrLayer2Result?.aadhaar.number || null,
                    voterId: ocrLayer2Result?.voterId.number || null
                },
                matched: ocrMatched,
                matchDetails: {
                    aadhaarMatch: ocrLayer1Result?.aadhaar.number === ocrLayer2Result?.aadhaar.number,
                    voterIdMatch: ocrLayer1Result?.voterId.number === ocrLayer2Result?.voterId.number
                }
            },
            imageComparison: {
                sha256Match: imageComparisonResult.sha256?.isIdentical || false,
                pHashSimilarity: imageComparisonResult.similarity || 0,
                passed: imageComparisonResult.matched || false,
                method: imageComparisonResult.matchMethod
            }
        });

        // Set voter status to pending
        voter.verificationStatus = 'pending';
        voter.verified = false;

        logger.info(`✓ Verification case created: ${verificationCase.caseId}`);

        res.json({
            success: true,
            verified: false,
            method: 'ADMIN_REVIEW',
            layer: 3,
            message: 'Automatic verification failed. Case created for admin review.',
            caseId: verificationCase.caseId,
            details: {
                ocrResults: {
                    step1: {
                        aadhaar: ocrLayer1Result?.aadhaar.found ? ocrLayer1Result.aadhaar.formatted : 'Not found',
                        voterId: ocrLayer1Result?.voterId.found ? ocrLayer1Result.voterId.number : 'Not found'
                    },
                    step2: {
                        aadhaar: ocrLayer2Result?.aadhaar.found ? ocrLayer2Result.aadhaar.formatted : 'Not found',
                        voterId: ocrLayer2Result?.voterId.found ? ocrLayer2Result.voterId.number : 'Not found'
                    },
                    matched: ocrMatched
                },
                imageComparison: {
                    similarity: imageComparisonResult.similarity,
                    method: imageComparisonResult.matchMethod
                },
                requiresAdminReview: true
            }
        });
    })
);

module.exports = router;
