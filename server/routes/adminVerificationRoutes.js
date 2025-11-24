/**
 * Admin Verification Routes
 * Handles admin review of verification cases
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const mockDb = require('../mockDb');
const verificationCaseService = require('../services/verificationCaseService');
const errorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * @route GET /api/admin/verification-cases
 * @desc Get all pending verification cases
 * @access Admin
 */
router.get(
    '/verification-cases',
    errorHandler.catchAsync(async (req, res) => {
        const { status } = req.query;

        let cases;
        if (status === 'pending') {
            // Read from idVerificationCases where KYC submissions are stored
            cases = (mockDb.idVerificationCases || []).filter(c => c.status === 'pending');
        } else if (status) {
            cases = (mockDb.idVerificationCases || []).filter(c => c.status === status);
        } else {
            cases = mockDb.idVerificationCases || [];
        }

        // Enrich cases with voter information
        const enrichedCases = cases.map(c => {
            const voter = mockDb.voters.find(v => v._id === c.voterId);
            return {
                ...c,
                voterInfo: voter ? {
                    name: voter.name,
                    email: voter.email,
                    phone: voter.phone
                } : null
            };
        });

        res.json({
            success: true,
            count: enrichedCases.length,
            cases: enrichedCases
        });
    })
);

/**
 * @route GET /api/admin/verification-cases/statistics
 * @desc Get verification case statistics
 * @access Admin
 */
router.get(
    '/verification-cases/statistics',
    errorHandler.catchAsync(async (req, res) => {
        const stats = verificationCaseService.getCaseStatistics(mockDb);

        res.json({
            success: true,
            statistics: stats
        });
    })
);

/**
 * @route GET /api/admin/verification-cases/:caseId
 * @desc Get detailed information about a specific case
 * @access Admin
 */
router.get(
    '/verification-cases/:caseId',
    errorHandler.catchAsync(async (req, res) => {
        const { caseId } = req.params;

        // Find case directly from idVerificationCases
        const verificationCase = (mockDb.idVerificationCases || []).find(c => c.caseId === caseId);

        if (!verificationCase) {
            throw new errorHandler.NotFoundError('Verification case not found');
        }

        // Get voter information
        const voter = mockDb.voters.find(v => v._id === verificationCase.voterId);

        // Get image URLs - use the filenames from the case object
        const originalImageUrl = verificationCase.registrationIdImage
            ? `/uploads/${verificationCase.registrationIdImage}`
            : null;

        const step2ImageUrl = verificationCase.newIdImage
            ? `/uploads/${verificationCase.newIdImage}`
            : null;

        res.json({
            success: true,
            case: {
                ...verificationCase,
                voterInfo: voter ? {
                    name: voter.name,
                    email: voter.email,
                    phone: voter.phone,
                    address: voter.address,
                    registeredAt: voter.createdAt
                } : null,
                images: {
                    original: originalImageUrl,
                    step2: step2ImageUrl
                }
            }
        });
    })
);

/**
 * @route POST /api/admin/verification-cases/:caseId/approve
 * @desc Approve a verification case
 * @access Admin
 */
router.post(
    '/verification-cases/:caseId/approve',
    errorHandler.catchAsync(async (req, res) => {
        const { caseId } = req.params;
        const { adminId, reason } = req.body;

        if (!adminId) {
            throw new errorHandler.ValidationError('Admin ID is required');
        }

        // Find case in idVerificationCases
        const caseIndex = (mockDb.idVerificationCases || []).findIndex(c => c.caseId === caseId);

        if (caseIndex === -1) {
            throw new errorHandler.NotFoundError('Verification case not found');
        }

        const verificationCase = mockDb.idVerificationCases[caseIndex];

        // Update case status
        verificationCase.status = 'approved';
        verificationCase.reviewedAt = new Date();
        verificationCase.reviewedBy = adminId;
        verificationCase.reviewReason = reason || 'Approved by admin after manual review';

        // Update voter verification status
        const voter = mockDb.voters.find(v => v._id === verificationCase.voterId);
        if (voter) {
            voter.verificationStatus = 'verified';
            voter.verified = true;
            voter.kycApprovedAt = new Date();
            voter.kycRejectedAt = null;
            voter.kycRejectionReason = null;
            voter.pendingIdCaseId = null;
        }

        logger.info(`Verification case ${caseId} approved by admin ${adminId}`);

        res.json({
            success: true,
            message: 'Verification case approved successfully',
            case: verificationCase
        });
    })
);

/**
 * @route POST /api/admin/verification-cases/:caseId/reject
 * @desc Reject a verification case
 * @access Admin
 */
router.post(
    '/verification-cases/:caseId/reject',
    errorHandler.catchAsync(async (req, res) => {
        const { caseId } = req.params;
        const { adminId, reason } = req.body;

        if (!adminId) {
            throw new errorHandler.ValidationError('Admin ID is required');
        }

        if (!reason) {
            throw new errorHandler.ValidationError('Rejection reason is required');
        }

        // Find case in idVerificationCases
        const caseIndex = (mockDb.idVerificationCases || []).findIndex(c => c.caseId === caseId);

        if (caseIndex === -1) {
            throw new errorHandler.NotFoundError('Verification case not found');
        }

        const verificationCase = mockDb.idVerificationCases[caseIndex];

        // Update case status
        verificationCase.status = 'rejected';
        verificationCase.reviewedAt = new Date();
        verificationCase.reviewedBy = adminId;
        verificationCase.rejectionReason = reason;

        // Update voter verification status
        const voter = mockDb.voters.find(v => v._id === verificationCase.voterId);
        if (voter) {
            voter.verificationStatus = 'rejected';
            voter.verified = false;
            voter.kycRejectedAt = new Date();
            voter.kycRejectionReason = reason;
            voter.pendingIdCaseId = null;
        }

        logger.info(`Verification case ${caseId} rejected by admin ${adminId}: ${reason}`);

        res.json({
            success: true,
            message: 'Verification case rejected successfully',
            case: verificationCase
        });
    })
);

/**
 * @route GET /api/admin/verification-cases/voter/:voterId
 * @desc Get all verification cases for a specific voter
 * @access Admin
 */
router.get(
    '/verification-cases/voter/:voterId',
    errorHandler.catchAsync(async (req, res) => {
        const { voterId } = req.params;

        const cases = (mockDb.idVerificationCases || []).filter(c => c.voterId === voterId);

        res.json({
            success: true,
            count: cases.length,
            cases: cases
        });
    })
);

/**
 * @route POST /api/admin/verification-cases/create-test
 * @desc Create a test verification case (for testing without server restart)
 * @access Admin
 */
router.post(
    '/verification-cases/create-test',
    errorHandler.catchAsync(async (req, res) => {
        const { voterId } = req.body;

        // Find voter
        const voter = mockDb.voters.find(v => v._id === voterId);

        if (!voter) {
            throw new errorHandler.NotFoundError('Voter not found');
        }

        // Create test case
        const testCase = {
            caseId: `case_test_${voterId}_${Date.now()}`,
            voterId: voter._id,
            voterName: voter.name,
            voterEmail: voter.email,
            registrationIdImage: voter.aadharCard || voter.voterIdCard || voter.idProof,
            newIdImage: voter.aadharCard || voter.voterIdCard || voter.idProof,
            newIdPath: null,
            newFileHash: voter.aadharCardHash || voter.voterIdCardHash || null,
            registeredAadhar: voter.aadharNumber || null,
            registeredVoterId: voter.voterIdNumber || null,
            extractedAadhar: voter.aadharNumber ? (parseInt(voter.aadharNumber) - 1).toString() : null, // Intentionally mismatch
            extractedVoterId: null,
            ocrText: 'Test OCR text - automated verification failed',
            matchDetails: [
                { type: 'Aadhar', target: voter.aadharNumber, match: false }
            ],
            verificationMethod: null,
            status: 'pending',
            createdAt: new Date()
        };

        // Add to idVerificationCases
        if (!mockDb.idVerificationCases) {
            mockDb.idVerificationCases = [];
        }
        mockDb.idVerificationCases.unshift(testCase);

        // Update voter's pendingIdCaseId
        voter.pendingIdCaseId = testCase.caseId;
        voter.verificationStatus = 'pending';

        logger.info(`Test verification case created for voter ${voterId}`);

        res.json({
            success: true,
            message: 'Test verification case created successfully',
            case: testCase
        });
    })
);

module.exports = router;
