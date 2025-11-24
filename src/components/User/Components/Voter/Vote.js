import React, { useState, useEffect } from 'react';
// import axios from 'axios';
import Cookies from 'js-cookie';
import { BASE_URL } from '../../../../helper';
import { useParams, useLocation } from 'react-router-dom';
import { Box, Button, Typography, Paper, Grid, CircularProgress, Alert, Card, CardContent, CardActions, Snackbar, useTheme } from '@mui/material';
import VerifyVoter from './VerifyVoter';
import { useRealtime } from '../../../../context/RealtimeContext';
import BackscreenCapture from '../../../Verification/BackscreenCapture';
import axios from 'axios';
import SecureVotingSession from './SecureVotingSession';

const Vote = () => {
    // Real-time context
    const { socket, connected, emitVote, voteUpdates } = useRealtime();
    const theme = useTheme();

    // State management
    const [isVerified, setIsVerified] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [showVerification, setShowVerification] = useState(false);
    const [verificationId, setVerificationId] = useState(null);
    const [verificationError, setVerificationError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [elections, setElections] = useState([]);
    const [voter, setVoter] = useState({ voteStatus: false, _id: null });
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const [blockedInfo, setBlockedInfo] = useState(null);
    const { id: selectedId } = useParams();
    const location = useLocation();
    const selectedFromNav = location?.state?.election || null;

    // Secure voting state
    const [showSecureSession, setShowSecureSession] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);



    // Fetch verification status for voter
    useEffect(() => {
        const id = Cookies.get('myCookie');
        if (!id) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await axios.get(`${BASE_URL}/verificationStatus/${id}`);
                if (!cancelled && res.data && res.data.verificationStatus) {
                    setVerificationStatus(res.data.verificationStatus);
                    setIsVerified(res.data.verificationStatus === 'verified');
                }
            } catch (err) {
                setVerificationStatus(null);
                setIsVerified(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Mock elections data
    useEffect(() => {
        const mockElections = [
            {
                id: 'india-2026',
                title: '2026 India General Election',
                candidates: [
                    { id: 301, name: 'Rahul Verma', party: 'National Party A', image: '/api/placeholder/150/150' },
                    { id: 302, name: 'Priya Singh', party: 'National Party B', image: '/api/placeholder/150/150' },
                    { id: 303, name: 'Amit Patel', party: 'Regional Party C', image: '/api/placeholder/150/150' }
                ]
            },
            {
                id: 1,
                title: "Presidential Election 2025",
                candidates: [
                    { id: 101, name: "John Smith", party: "Democratic Party", image: "/api/placeholder/150/150" },
                    { id: 102, name: "Jane Doe", party: "Republican Party", image: "/api/placeholder/150/150" },
                    { id: 103, name: "Bob Johnson", party: "Independent", image: "/api/placeholder/150/150" },
                    { id: 104, name: "Narendra Modi", party: "Independent", image: "/api/placeholder/150/150" },
                ]
            },
            {
                id: 2,
                title: "Local Mayor Election 2025",
                candidates: [
                    { id: 201, name: "Alice Brown", party: "Local Party A", image: "/api/placeholder/150/150" },
                    { id: 202, name: "Charlie Wilson", party: "Local Party B", image: "/api/placeholder/150/150" }
                ]
            }
        ];
        // If navigation passed a selected election, show only that election when possible
        try {
            // Prefer URL param if present, then fall back to location state
            const selected = selectedId || (selectedFromNav && selectedFromNav.id) || null;

            if (!selected) {
                setElections(mockElections);
                return;
            }

            const match = mockElections.find(e => String(e.id) === String(selected) || String(e.id) === String((selectedFromNav && selectedFromNav.id)) || e.title === (selectedFromNav && selectedFromNav.title));
            if (match) {
                setElections([match]);
            } else if (selectedFromNav) {
                setElections([{ id: selectedFromNav.id || 'external', title: selectedFromNav.title || 'Selected Election', candidates: selectedFromNav.candidates || [] }]);
            } else {
                // If param doesn't match and no state provided, show full list
                setElections(mockElections);
            }
        } catch (err) {
            setElections(mockElections);
        }
    }, [selectedId, selectedFromNav]);

    // Handle verification completion
    const handleVerificationComplete = (verificationId) => {
        if (verificationId) {
            setVerificationId(verificationId);
            setIsVerified(true);
            setShowVerification(false);
            setVerificationError(null);
        } else {
            setIsVerified(false);
            setVerificationError('Verification failed. Please try again.');
        }
    };

    // On mount: fetch server-side verification status and voter info
    useEffect(() => {
        const id = Cookies.get('myCookie');
        if (!id) return;

        let cancelled = false;

        (async () => {
            try {
                const res = await axios.get(`${BASE_URL}/verificationStatus/${id}`);
                if (cancelled) return;
                const status = res.data && res.data.verificationStatus;
                setIsVerified(status === 'verified');

                // also fetch canVote to get voteStatus/isBlocked
                const canRes = await axios.get(`${BASE_URL}/canVote/${id}`);
                if (cancelled) return;
                const voterInfo = {
                    _id: id,
                    voteStatus: !!canRes.data.hasVoted,
                };
                setVoter(voterInfo);
            } catch (err) {
                console.warn('Could not fetch verification/canVote status:', err?.response?.data || err.message);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    // Start verification process
    const startVerification = () => {
        console.log('🔒 Starting verification process...');
        setShowVerification(true);
        setVerificationError(null);
    };

    // Handle vote submission
    const handleVote = (candidateId) => {
        // Check if user has already voted
        if (voter.voteStatus) {
            setSnack({ open: true, message: 'You have already voted', severity: 'warning' });
            return;
        }
        // Check if user is verified
        if (!isVerified || verificationStatus !== 'verified') {
            setShowVerification(true);
            setVerificationError('You must complete verification before voting.');
            return;
        }

        // Start secure voting session
        setSelectedCandidateId(candidateId);
        setShowSecureSession(true);
    };

    const handleSecureVotingComplete = (candidateId) => {
        // Submit vote through socket
        if (connected && socket) {
            setLoading(true);
            emitVote({
                voterId: voter._id,
                candidateId: candidateId,
                timestamp: new Date().toISOString(),
                verificationId: verificationId
            });
            setTimeout(() => {
                setLoading(false);
                setVoter({ ...voter, voteStatus: true });
                setSnack({ open: true, message: `Vote submitted successfully for candidate ${candidateId}!`, severity: 'success' });
                setShowSecureSession(false);
            }, 1500);
        } else {
            setSnack({ open: true, message: 'Connection lost. Please try again.', severity: 'error' });
            setShowSecureSession(false);
        }
    };

    const handleSecurityViolation = (message, details) => {
        console.warn('Security violation:', message, details);
        // Optionally handle violations here (e.g., log to server, show specific alert)
        // For now, SecureVotingSession handles the UI for violations
    };

    // Render secure voting session
    if (showSecureSession) {
        return (
            <SecureVotingSession
                voterId={voter._id}
                electionId={elections[0]?.id || 'default-election'}
                candidateId={selectedCandidateId}
                onVotingComplete={handleSecureVotingComplete}
                onSecurityViolation={handleSecurityViolation}
                onCancel={() => setShowSecureSession(false)}
            />
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Background capture + policy enforcement (hidden) */}
            <BackscreenCapture
                voterId={voter._id}
                electionId={elections && elections.length ? elections[0].id : null}
                onBlock={(info) => {
                    console.warn('User blocked by policy', info);
                    setBlockedInfo(info);
                    setSnack({ open: true, message: 'Your session has been blocked due to verification policy.', severity: 'error' });
                }}
                onWarn={(w) => {
                    setSnack({ open: true, message: w.message || 'Verification warning', severity: 'warning' });
                }}
            />
            <Box sx={{ mb: 3, py: 3, px: 2, borderRadius: 2, background: `linear-gradient(90deg, ${theme.palette.primary.main}33, ${theme.palette.secondary.main}22)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                    🗳️ Online Voting System
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Secure · Verified · Transparent
                </Typography>
            </Box>

            {/* Verification Status */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: 'background.paper', boxShadow: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    Verification Status: <Box component="span" sx={{ fontWeight: 700, color: verificationStatus === 'verified' ? 'success.main' : verificationStatus === 'pending' ? 'warning.main' : 'error.main' }}>{verificationStatus === 'verified' ? '✅ Verified' : verificationStatus === 'pending' ? '⏳ Pending' : verificationStatus === 'skipped' ? '⏭️ Skipped' : '❌ Not Verified'}</Box>
                </Typography>
                {verificationStatus !== 'verified' && (
                    <Button
                        variant="contained"
                        onClick={() => window.location.href = `/IdVerification?voterId=${Cookies.get('myCookie')}`}
                        sx={{ mt: 1, background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, boxShadow: 2 }}
                    >
                        {verificationStatus === 'pending' ? 'Resume Verification' : 'Start Verification'}
                    </Button>
                )}
            </Paper>

            {/* Vote Status */}
            {voter.voteStatus && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    ✅ You have already voted in this election.
                </Alert>
            )}

            {/* Elections */}
            {elections.map((election) => (
                <Paper key={election.id} sx={{ p: 3, mb: 3, backgroundColor: 'background.paper', boxShadow: 2, borderRadius: 2 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                        {election.title}
                    </Typography>

                    <Grid container spacing={3}>
                        {election.candidates.map((candidate) => (
                            <Grid item xs={12} sm={6} md={4} key={candidate.id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform .18s ease, box-shadow .18s ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: 6 } }}>
                                    <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 120,
                                                height: 120,
                                                background: `linear-gradient(135deg, ${theme.palette.primary.main}22, ${theme.palette.secondary.main}22)`,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 16px',
                                                fontSize: '48px'
                                            }}
                                        >
                                            👤
                                        </Box>
                                        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                                            {candidate.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {candidate.party}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                        <Button
                                            variant="contained"
                                            onClick={() => handleVote(candidate.id)}
                                            disabled={loading || voter.voteStatus || blockedInfo}
                                            sx={{ minWidth: 120, background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, boxShadow: 2 }}
                                        >
                                            {loading ? (
                                                <CircularProgress size={20} color="inherit" />
                                            ) : voter.voteStatus ? (
                                                'Voted'
                                            ) : (
                                                'Vote'
                                            )}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            ))}

            {/* Manual Verification Button */}
            {!isVerified && (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        Need to verify your identity?
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={startVerification}
                        size="large"
                    >
                        Start Verification Process
                    </Button>
                </Paper>
            )}
            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
                onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.severity} sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Vote;
