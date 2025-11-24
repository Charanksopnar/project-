import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../helper';
import "./IdVerification.css";
import UserNavbar from "../Navbar/UserNavbar";
import { Alert, CircularProgress, Snackbar } from '@mui/material';
import LivenessCheck from './LivenessCheck';

const IdVerification = () => {
    const [idImage, setIdImage] = useState(null);
    const [idType, setIdType] = useState('aadhar');
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
    const [showLiveness, setShowLiveness] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const voterId = searchParams.get('voterId');

    const handleIdImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setIdImage(e.target.files[0]);
        }
    };

    const handleIdTypeChange = (e) => {
        setIdType(e.target.value);
    };

    const handleCloseToast = () => {
        setToast({ ...toast, open: false });
    };

    const handleLivenessComplete = () => {
        setToast({ open: true, message: "All Verification Steps Completed! Redirecting...", severity: 'success' });
        setTimeout(() => {
            // Open in new tab as requested
            window.open('/', '_blank');
        }, 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setVerificationResult(null);
        setLoading(true);

        if (!idImage) {
            setError("ID image is required.");
            setToast({ open: true, message: "ID image is required.", severity: 'error' });
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('idImage', idImage);
        formData.append('idType', idType);
        if (voterId) {
            formData.append('voterId', voterId);
            formData.append('userId', voterId); // For logging
        }

        try {
            const res = await axios.post(`${BASE_URL}/api/security/verify-id-step2`, formData);
            setVerificationResult(res.data);
            setLoading(false);

            if (res.data.success) {
                if (res.data.verificationStatus === 'verified' || res.data.verificationStatus === 'pending') {
                    setToast({ open: true, message: "ID Verified! Proceeding to Liveness Check...", severity: 'success' });
                    // Delay slightly to let user see the success message before switching
                    setTimeout(() => {
                        setShowLiveness(true);
                    }, 1500);
                } else {
                    setToast({ open: true, message: "Verification Failed. Please try again.", severity: 'error' });
                }
            }
        } catch (err) {
            const errorMessage = err.response ? err.response.data.message : "An error occurred during verification.";
            setError(errorMessage);
            setToast({ open: true, message: errorMessage, severity: 'error' });
            setLoading(false);
        }
    };

    return (
        <div className="id-verification-page">
            <UserNavbar />
            <div className="id-verification-container">
                {!showLiveness ? (
                    <>
                        <div className="verification-card">
                            <h2>ID Verification</h2>
                            <p className="instruction-text">Please upload your government ID to verify your identity.</p>

                            <form onSubmit={handleSubmit} className="verification-form">
                                <div className="form-group">
                                    <label>Select ID Type</label>
                                    <select value={idType} onChange={handleIdTypeChange} className="form-select">
                                        <option value="aadhar">Aadhar Card</option>
                                        <option value="voter">Voter ID</option>
                                        <option value="driving">Driving License</option>
                                    </select>
                                </div>

                                <div className="form-group file-upload-group">
                                    <label>Upload ID Document</label>
                                    <div className="file-input-wrapper">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleIdImageChange}
                                            id="id-upload"
                                            className="file-input"
                                        />
                                        <label htmlFor="id-upload" className="file-label">
                                            {idImage ? idImage.name : "Choose File"}
                                        </label>
                                    </div>
                                    <small>Ensure the text is clear and readable.</small>
                                </div>

                                <button type="submit" className="verify-btn" disabled={loading}>
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Identity'}
                                </button>
                            </form>
                        </div>

                        {error && (
                            <div className="error-message">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {verificationResult && !verificationResult.success && (
                            <div className="verification-result">
                                <h3>❌ Verification Failed</h3>
                                <p>{verificationResult.message}</p>
                            </div>
                        )}
                    </>
                ) : (
                    <LivenessCheck
                        voterId={voterId}
                        onComplete={handleLivenessComplete}
                    />
                )}
            </div>

            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={handleCloseToast}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default IdVerification;
