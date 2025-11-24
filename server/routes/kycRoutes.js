const express = require('express');
const router = express.Router();
const mockDb = require('../mockDb');
const { adminAuth } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

/**
 * @route GET /api/kyc/pending
 * @desc Get all pending KYC submissions for admin review
 * @access Admin only
 */
router.get('/pending', adminAuth, async (req, res) => {
    try {
        const pendingVoters = mockDb.voters.filter(v => v.verificationStatus === 'pending')
            .map(v => ({
                _id: v._id,
                name: v.name,
                email: v.email,
                kycData: v.kycData,
                kycDocuments: v.kycDocuments,
                kycSubmissionAttempts: v.kycSubmissionAttempts,
                createdAt: v.createdAt
            }))
            .sort((a, b) => new Date(b.kycData?.submittedAt || 0) - new Date(a.kycData?.submittedAt || 0));

        res.status(200).json({
            success: true,
            count: pendingVoters.length,
            voters: pendingVoters
        });
    } catch (error) {
        console.error('Error fetching pending KYC:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route GET /api/kyc/details/:id
 * @desc Get detailed KYC information for a specific voter
 * @access Admin only
 */
router.get('/details/:id', adminAuth, async (req, res) => {
    try {
        const voter = mockDb.voters.find(v => v._id === req.params.id);

        if (!voter) {
            return res.status(404).json({
                success: false,
                message: 'Voter not found'
            });
        }

        res.status(200).json({
            success: true,
            voter: {
                _id: voter._id,
                name: voter.name,
                email: voter.email,
                phone: voter.phone,
                address: voter.address,
                dob: voter.dob,
                age: voter.age,
                verificationStatus: voter.verificationStatus,
                kycData: voter.kycData,
                kycDocuments: voter.kycDocuments,
                kycSubmissionAttempts: voter.kycSubmissionAttempts,
                kycApprovedAt: voter.kycApprovedAt,
                kycRejectedAt: voter.kycRejectedAt,
                kycRejectionReason: voter.kycRejectionReason,
                createdAt: voter.createdAt
            }
        });
    } catch (error) {
        console.error('Error fetching KYC details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route POST /api/kyc/approve/:id
 * @desc Approve a KYC submission
 * @access Admin only
 */
router.post('/approve/:id', adminAuth, async (req, res) => {
    try {
        const voter = mockDb.voters.find(v => v._id === req.params.id);

        if (!voter) {
            return res.status(404).json({
                success: false,
                message: 'Voter not found'
            });
        }

        // Update verification status
        voter.verificationStatus = 'verified';
        voter.verified = true;
        voter.kycApprovedAt = new Date();
        voter.kycRejectedAt = null;
        voter.kycRejectionReason = null;

        // Emit Socket.io notification (will be handled by server.js)
        if (req.app.get('io')) {
            req.app.get('io').emit('notification', {
                id: Date.now(),
                type: 'kyc_approved',
                title: '✅ KYC Approved',
                message: `Your ID verification has been approved! You can now participate in elections.`,
                data: {
                    voterId: voter._id,
                    voterName: voter.name,
                    approvedAt: voter.kycApprovedAt
                },
                timestamp: new Date(),
                read: false,
                userId: voter._id.toString()
            });
        }

        res.status(200).json({
            success: true,
            message: 'KYC approved successfully',
            voter: {
                _id: voter._id,
                name: voter.name,
                verificationStatus: voter.verificationStatus,
                kycApprovedAt: voter.kycApprovedAt
            }
        });
    } catch (error) {
        console.error('Error approving KYC:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route POST /api/kyc/reject/:id
 * @desc Reject a KYC submission with reason
 * @access Admin only
 */
router.post('/reject/:id', adminAuth, async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const voter = mockDb.voters.find(v => v._id === req.params.id);

        if (!voter) {
            return res.status(404).json({
                success: false,
                message: 'Voter not found'
            });
        }

        // Update verification status
        voter.verificationStatus = 'rejected';
        voter.verified = false;
        voter.kycRejectedAt = new Date();
        voter.kycRejectionReason = reason;
        voter.kycApprovedAt = null;

        // Emit Socket.io notification
        if (req.app.get('io')) {
            req.app.get('io').emit('notification', {
                id: Date.now(),
                type: 'kyc_rejected',
                title: '❌ KYC Rejected',
                message: `Your ID verification was rejected. Reason: ${reason}`,
                data: {
                    voterId: voter._id,
                    voterName: voter.name,
                    rejectionReason: reason,
                    rejectedAt: voter.kycRejectedAt
                },
                timestamp: new Date(),
                read: false,
                userId: voter._id.toString()
            });
        }

        res.status(200).json({
            success: true,
            message: 'KYC rejected',
            voter: {
                _id: voter._id,
                name: voter.name,
                verificationStatus: voter.verificationStatus,
                kycRejectedAt: voter.kycRejectedAt,
                kycRejectionReason: voter.kycRejectionReason
            }
        });
    } catch (error) {
        console.error('Error rejecting KYC:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route GET /api/kyc/all
 * @desc Get all KYC submissions with filtering
 * @access Admin only
 */
router.get('/all', adminAuth, async (req, res) => {
    try {
        const { status } = req.query;

        let voters = mockDb.voters;

        if (status) {
            voters = voters.filter(v => v.verificationStatus === status);
        }

        // Select fields and sort
        const mappedVoters = voters.map(v => ({
            _id: v._id,
            name: v.name,
            email: v.email,
            verificationStatus: v.verificationStatus,
            kycData: v.kycData,
            kycSubmissionAttempts: v.kycSubmissionAttempts,
            kycApprovedAt: v.kycApprovedAt,
            kycRejectedAt: v.kycRejectedAt
        })).sort((a, b) => new Date(b.kycData?.submittedAt || 0) - new Date(a.kycData?.submittedAt || 0));

        res.status(200).json({
            success: true,
            count: mappedVoters.length,
            voters: mappedVoters
        });
    } catch (error) {
        console.error('Error fetching all KYC:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route GET /api/kyc/id-cases
 * @desc Get all ID verification cases for admin review
 * @access Admin only
 */
router.get('/id-cases', adminAuth, async (req, res) => {
    try {
        const mockDb = require('../mockDb');
        const dataDir = path.join(__dirname, '..', 'utils', 'data');
        const casesFile = path.join(dataDir, 'idVerificationCases.json');
        let casesSrc = [];

        if (fs.existsSync(casesFile)) {
            try {
                const raw = fs.readFileSync(casesFile, 'utf8');
                casesSrc = raw ? JSON.parse(raw) : [];
            } catch (e) {
                casesSrc = mockDb.idVerificationCases || [];
            }
        } else {
            casesSrc = mockDb.idVerificationCases || [];
        }

        const cases = (casesSrc || []).map(c => ({
            caseId: c.caseId || c._id || c._caseId,
            voterId: c.voterId,
            voterName: c.voterName,
            createdAt: c.createdAt,
            status: c.status
        }));

        res.status(200).json({ success: true, count: cases.length, cases });
    } catch (error) {
        console.error('Error fetching ID cases:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

/**
 * @route GET /api/kyc/id-cases/:caseId
 * @desc Get detailed ID verification case info
 * @access Admin only
 */
router.get('/id-cases/:caseId', adminAuth, async (req, res) => {
    try {
        const mockDb = require('../mockDb');
        const cs = (mockDb.idVerificationCases || []).find(c => c.caseId === req.params.caseId);
        if (!cs) return res.status(404).json({ success: false, message: 'Case not found' });

        res.status(200).json({ success: true, case: cs });
    } catch (error) {
        console.error('Error fetching ID case details:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

/**
 * @route POST /api/kyc/id-cases/:caseId/approve
 * @desc Admin approves an ID verification case
 * @access Admin only
 */
router.post('/id-cases/:caseId/approve', adminAuth, async (req, res) => {
    try {
        const mockDb = require('../mockDb');
        const csIndex = (mockDb.idVerificationCases || []).findIndex(c => c.caseId === req.params.caseId);
        if (csIndex === -1) return res.status(404).json({ success: false, message: 'Case not found' });

        const cs = mockDb.idVerificationCases[csIndex];
        cs.status = 'approved';
        cs.reviewedAt = new Date();
        cs.reviewedBy = req.admin ? req.admin.username : 'admin';

        // Update voter verification status
        const voter = mockDb.voters.find(v => v._id === cs.voterId);
        if (voter) {
            voter.verificationStatus = 'verified';
            voter.verified = true;
            voter.kycApprovedAt = new Date();
            voter.kycRejectedAt = null;
            voter.kycRejectionReason = null;
        }

        res.status(200).json({ success: true, message: 'Case approved and voter verified', case: cs });
    } catch (error) {
        console.error('Error approving ID case:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

/**
 * @route POST /api/kyc/id-cases/:caseId/reject
 * @desc Admin rejects an ID verification case with reason
 * @access Admin only
 */
router.post('/id-cases/:caseId/reject', adminAuth, async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason required' });

        const mockDb = require('../mockDb');
        const csIndex = (mockDb.idVerificationCases || []).findIndex(c => c.caseId === req.params.caseId);
        if (csIndex === -1) return res.status(404).json({ success: false, message: 'Case not found' });

        const cs = mockDb.idVerificationCases[csIndex];
        cs.status = 'rejected';
        cs.reviewedAt = new Date();
        cs.reviewedBy = req.admin ? req.admin.username : 'admin';
        cs.rejectionReason = reason;

        // Update voter verification status
        const voter = mockDb.voters.find(v => v._id === cs.voterId);
        if (voter) {
            voter.verificationStatus = 'rejected';
            voter.verified = false;
            voter.kycRejectedAt = new Date();
            voter.kycRejectionReason = reason;
        }

        res.status(200).json({ success: true, message: 'Case rejected and voter marked rejected', case: cs });
    } catch (error) {
        console.error('Error rejecting ID case:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
