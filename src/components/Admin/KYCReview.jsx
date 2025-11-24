import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../helper';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardMedia,
    CardContent,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    ZoomIn as ZoomIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const KYCReview = () => {
    const [pendingKYC, setPendingKYC] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedVoter, setSelectedVoter] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [imageZoomOpen, setImageZoomOpen] = useState(false);
    const [zoomedImage, setZoomedImage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch pending KYC submissions
    const fetchPendingKYC = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            // Use new 3-layer verification endpoint
            const res = await axios.get(`${BASE_URL}/api/admin/verification-cases?status=pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingKYC(res.data.cases || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch pending KYC submissions');
        } finally {
            setLoading(false);
        }
    };

    // Fetch detailed case information
    const fetchVoterDetails = async (caseId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${BASE_URL}/api/admin/verification-cases/${caseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedVoter(res.data.case);
            setViewDialogOpen(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch case details');
        }
    };

    // Approve KYC
    const handleApprove = async (caseId) => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem('adminToken');
            const adminId = 'admin1'; // In real app, get from token

            await axios.post(`${BASE_URL}/api/admin/verification-cases/${caseId}/approve`, {
                adminId: adminId,
                reason: 'Approved by admin'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('KYC approved successfully!');
            setViewDialogOpen(false);
            fetchPendingKYC();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve KYC');
        } finally {
            setActionLoading(false);
        }
    };

    // Reject KYC
    const handleReject = async (caseId) => {
        if (!rejectionReason) {
            setError('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(true);
            const token = localStorage.getItem('adminToken');
            const adminId = 'admin1'; // In real app, get from token

            await axios.post(`${BASE_URL}/api/admin/verification-cases/${caseId}/reject`, {
                adminId: adminId,
                reason: rejectionReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('KYC rejected successfully');
            setRejectDialogOpen(false);
            setViewDialogOpen(false);
            setRejectionReason('');
            fetchPendingKYC();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject KYC');
        } finally {
            setActionLoading(false);
        }
    };

    // Image zoom handler
    const handleImageZoom = (imageUrl) => {
        setZoomedImage(imageUrl);
        setImageZoomOpen(true);
    };

    useEffect(() => {
        fetchPendingKYC();
    }, []);

    // Auto-dismiss alerts
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'verified': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            default: return 'default';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const rejectionReasons = [
        'Document not clear',
        'Document appears fake/tampered',
        'Face does not match ID',
        'Underage voter',
        'Incomplete information',
        'Duplicate submission',
        'Other'
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
                🔍 KYC Review Dashboard
            </Typography>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Main Table */}
            <Paper elevation={3} sx={{ borderRadius: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : pendingKYC.length === 0 ? (
                    <Box sx={{ p: 5, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            No pending KYC submissions
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'primary.main' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Submitted</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Attempts</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pendingKYC.map((item) => (
                                    <TableRow key={item.caseId} hover>
                                        <TableCell>{item.voterInfo?.name || 'Unknown'}</TableCell>
                                        <TableCell>{item.voterInfo?.email || 'N/A'}</TableCell>
                                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={item.status}
                                                color={getStatusColor(item.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => fetchVoterDetails(item.caseId)}
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* View Details Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Verification Case Details</Typography>
                        <IconButton onClick={() => setViewDialogOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedVoter && (
                        <Grid container spacing={3}>
                            {/* Voter Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom color="primary">
                                    Voter Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">Name:</Typography>
                                        <Typography variant="body1" fontWeight={500}>{selectedVoter.voterInfo?.name}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                                        <Typography variant="body1" fontWeight={500}>{selectedVoter.voterInfo?.email}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">Phone:</Typography>
                                        <Typography variant="body1" fontWeight={500}>{selectedVoter.voterInfo?.phone || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">Address:</Typography>
                                        <Typography variant="body1" fontWeight={500}>{selectedVoter.voterInfo?.address || 'N/A'}</Typography>
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* ID Number Comparison (Manual Verification) */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom color="primary">
                                    ID Number Comparison
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Aadhar Number</Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">Registered:</Typography>
                                                    <Typography variant="body2" fontWeight={600}>{selectedVoter.registeredAadhar || 'Not Registered'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">Extracted (OCR):</Typography>
                                                    <Typography variant="body2" fontWeight={600} color={selectedVoter.registeredAadhar === selectedVoter.extractedAadhar ? 'success.main' : 'error.main'}>
                                                        {selectedVoter.extractedAadhar || 'Not Detected'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Voter ID Number</Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">Registered:</Typography>
                                                    <Typography variant="body2" fontWeight={600}>{selectedVoter.registeredVoterId || 'Not Registered'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">Extracted (OCR):</Typography>
                                                    <Typography variant="body2" fontWeight={600} color={selectedVoter.registeredVoterId === selectedVoter.extractedVoterId ? 'success.main' : 'error.main'}>
                                                        {selectedVoter.extractedVoterId || 'Not Detected'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Automated Verification Results */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom color="primary">
                                    Automated Verification Results
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" gutterBottom>OCR Matching (Layer 1)</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={selectedVoter.ocrResults?.matched ? "MATCHED" : "NO MATCH"}
                                                    color={selectedVoter.ocrResults?.matched ? "success" : "error"}
                                                    size="small"
                                                />
                                                <Typography variant="caption">
                                                    Aadhaar: {selectedVoter.ocrResults?.step1?.aadhaar || 'N/A'} vs {selectedVoter.ocrResults?.step2?.aadhaar || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" gutterBottom>Image Comparison (Layer 2)</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={`${selectedVoter.imageComparison?.pHashSimilarity || 0}% Similarity`}
                                                    color={selectedVoter.imageComparison?.passed ? "success" : "warning"}
                                                    size="small"
                                                />
                                                <Typography variant="caption">
                                                    Method: {selectedVoter.imageComparison?.method || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Documents Comparison */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom color="primary">
                                    Document Comparison
                                </Typography>
                                <Grid container spacing={2}>
                                    {selectedVoter.images?.original && (
                                        <Grid item xs={6}>
                                            <Card>
                                                <CardMedia
                                                    component="img"
                                                    height="250"
                                                    image={`${BASE_URL}${selectedVoter.images.original}`}
                                                    alt="Original ID (Step 1)"
                                                    sx={{ objectFit: 'contain', bgcolor: 'grey.100', cursor: 'pointer' }}
                                                    onClick={() => handleImageZoom(`${BASE_URL}${selectedVoter.images.original}`)}
                                                />
                                                <CardContent>
                                                    <Typography variant="subtitle2" align="center">Original ID (Step 1)</Typography>
                                                    <Typography variant="caption" display="block" align="center" color="text.secondary">
                                                        Uploaded: {formatDate(selectedVoter.originalIdDocument?.uploadedAt)}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    )}
                                    {selectedVoter.images?.step2 && (
                                        <Grid item xs={6}>
                                            <Card>
                                                <CardMedia
                                                    component="img"
                                                    height="250"
                                                    image={`${BASE_URL}${selectedVoter.images.step2}`}
                                                    alt="New ID (Step 2)"
                                                    sx={{ objectFit: 'contain', bgcolor: 'grey.100', cursor: 'pointer' }}
                                                    onClick={() => handleImageZoom(`${BASE_URL}${selectedVoter.images.step2}`)}
                                                />
                                                <CardContent>
                                                    <Typography variant="subtitle2" align="center">New ID (Step 2)</Typography>
                                                    <Typography variant="caption" display="block" align="center" color="text.secondary">
                                                        Uploaded: {formatDate(selectedVoter.step2IdDocument?.uploadedAt)}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => setRejectDialogOpen(true)}
                        disabled={actionLoading}
                    >
                        Reject
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => handleApprove(selectedVoter.caseId)}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : 'Approve'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject KYC Submission</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Rejection Reason</InputLabel>
                        <Select
                            value={rejectionReason}
                            label="Rejection Reason"
                            onChange={(e) => setRejectionReason(e.target.value)}
                        >
                            {rejectionReasons.map((reason) => (
                                <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {rejectionReason === 'Other' && (
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Please specify reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleReject(selectedVoter?.caseId)}
                        disabled={!rejectionReason || actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : 'Confirm Reject'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Image Zoom Dialog */}
            <Dialog open={imageZoomOpen} onClose={() => setImageZoomOpen(false)} maxWidth="lg">
                <DialogContent sx={{ p: 0 }}>
                    <img src={zoomedImage} alt="Zoomed" style={{ width: '100%', height: 'auto' }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImageZoomOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default KYCReview;
