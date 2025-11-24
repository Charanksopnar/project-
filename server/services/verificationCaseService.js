/**
 * Verification Case Service
 * Manages verification cases for admin review
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Create a new verification case
 */
function createVerificationCase(mockDb, caseData) {
    const {
        voterId,
        originalIdDocument,
        step2IdDocument,
        ocrResults,
        imageComparison
    } = caseData;

    const verificationCase = {
        caseId: uuidv4(),
        voterId: voterId,
        status: 'pending',
        originalIdDocument: {
            filename: originalIdDocument.filename,
            path: originalIdDocument.path,
            uploadedAt: originalIdDocument.uploadedAt || new Date()
        },
        step2IdDocument: {
            filename: step2IdDocument.filename,
            path: step2IdDocument.path,
            uploadedAt: new Date()
        },
        ocrResults: {
            step1: ocrResults.step1 || { aadhaar: null, voterId: null },
            step2: ocrResults.step2 || { aadhaar: null, voterId: null },
            matched: ocrResults.matched || false,
            matchDetails: ocrResults.matchDetails || null
        },
        imageComparison: {
            sha256Match: imageComparison.sha256Match || false,
            pHashSimilarity: imageComparison.pHashSimilarity || 0,
            passed: imageComparison.passed || false,
            method: imageComparison.method || null
        },
        adminReview: {
            reviewedBy: null,
            reviewedAt: null,
            decision: null,
            reason: null
        },
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Initialize verificationCases array if it doesn't exist
    if (!mockDb.verificationCases) {
        mockDb.verificationCases = [];
    }

    mockDb.verificationCases.push(verificationCase);

    console.log(`✓ Verification case created: ${verificationCase.caseId}`);

    return verificationCase;
}

/**
 * Get all pending verification cases
 */
function getPendingCases(mockDb) {
    if (!mockDb.verificationCases) {
        return [];
    }

    return mockDb.verificationCases.filter(c => c.status === 'pending');
}

/**
 * Get verification case by ID
 */
function getCaseById(mockDb, caseId) {
    if (!mockDb.verificationCases) {
        return null;
    }

    return mockDb.verificationCases.find(c => c.caseId === caseId);
}

/**
 * Get verification cases by voter ID
 */
function getCasesByVoterId(mockDb, voterId) {
    if (!mockDb.verificationCases) {
        return [];
    }

    return mockDb.verificationCases.filter(c => c.voterId === voterId);
}

/**
 * Approve verification case
 */
function approveCase(mockDb, caseId, adminId, reason = 'Approved by admin') {
    const verificationCase = getCaseById(mockDb, caseId);

    if (!verificationCase) {
        return {
            success: false,
            error: 'Case not found'
        };
    }

    if (verificationCase.status !== 'pending') {
        return {
            success: false,
            error: 'Case is not pending'
        };
    }

    // Update case
    verificationCase.status = 'approved';
    verificationCase.adminReview = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        decision: 'approved',
        reason: reason
    };
    verificationCase.updatedAt = new Date();

    // Update voter verification status
    const voter = mockDb.voters.find(v => v._id === verificationCase.voterId);
    if (voter) {
        voter.verificationStatus = 'verified';
        voter.verified = true;
        voter.kycApprovedAt = new Date();
        voter.kycApprovedBy = adminId;
    }

    console.log(`✓ Case ${caseId} approved by ${adminId}`);

    return {
        success: true,
        case: verificationCase
    };
}

/**
 * Reject verification case
 */
function rejectCase(mockDb, caseId, adminId, reason) {
    const verificationCase = getCaseById(mockDb, caseId);

    if (!verificationCase) {
        return {
            success: false,
            error: 'Case not found'
        };
    }

    if (verificationCase.status !== 'pending') {
        return {
            success: false,
            error: 'Case is not pending'
        };
    }

    if (!reason) {
        return {
            success: false,
            error: 'Rejection reason is required'
        };
    }

    // Update case
    verificationCase.status = 'rejected';
    verificationCase.adminReview = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        decision: 'rejected',
        reason: reason
    };
    verificationCase.updatedAt = new Date();

    // Update voter verification status
    const voter = mockDb.voters.find(v => v._id === verificationCase.voterId);
    if (voter) {
        voter.verificationStatus = 'rejected';
        voter.verified = false;
        voter.kycRejectedAt = new Date();
        voter.kycRejectionReason = reason;
    }

    console.log(`✓ Case ${caseId} rejected by ${adminId}: ${reason}`);

    return {
        success: true,
        case: verificationCase
    };
}

/**
 * Get case statistics
 */
function getCaseStatistics(mockDb) {
    if (!mockDb.verificationCases) {
        return {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
        };
    }

    return {
        total: mockDb.verificationCases.length,
        pending: mockDb.verificationCases.filter(c => c.status === 'pending').length,
        approved: mockDb.verificationCases.filter(c => c.status === 'approved').length,
        rejected: mockDb.verificationCases.filter(c => c.status === 'rejected').length
    };
}

module.exports = {
    createVerificationCase,
    getPendingCases,
    getCaseById,
    getCasesByVoterId,
    approveCase,
    rejectCase,
    getCaseStatistics
};
