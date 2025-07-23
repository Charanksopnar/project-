import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Grid, CircularProgress, Alert, Card, CardContent, CardActions } from '@mui/material';
import VerifyVoter from './VerifyVoter';

const Vote = () => {
    // State management
    const [isVerified, setIsVerified] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [verificationId, setVerificationId] = useState(null);
    const [verificationError, setVerificationError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [elections, setElections] = useState([]);
    const [voter, setVoter] = useState({ voteStatus: false });

    // Mock elections data
    useEffect(() => {
        const mockElections = [
            {
                id: 1,
                title: "Presidential Election 2024",
                candidates: [
                    { id: 101, name: "John Smith", party: "Democratic Party", image: "/api/placeholder/150/150" },
                    { id: 102, name: "Jane Doe", party: "Republican Party", image: "/api/placeholder/150/150" },
                    { id: 103, name: "Bob Johnson", party: "Independent", image: "/api/placeholder/150/150" }
                ]
            },
            {
                id: 2,
                title: "Local Mayor Election 2024",
                candidates: [
                    { id: 201, name: "Alice Brown", party: "Local Party A", image: "/api/placeholder/150/150" },
                    { id: 202, name: "Charlie Wilson", party: "Local Party B", image: "/api/placeholder/150/150" }
                ]
            }
        ];
        setElections(mockElections);
    }, []);

    // Handle verification completion
    const handleVerificationComplete = (verificationId) => {
        console.log('🎯 handleVerificationComplete called in Vote.js with:', verificationId);
        
        if (verificationId) {
            console.log('✅ Valid verification ID received, updating state...');
            setVerificationId(verificationId);
            setIsVerified(true);
            setShowVerification(false);
            setVerificationError(null);
            console.log('📝 State updated: isVerified=true, showVerification=false');
        } else {
            console.log('❌ No verification ID provided, verification failed');
            setIsVerified(false);
            setVerificationError('Verification failed. Please try again.');
        }
    };

    // Start verification process
    const startVerification = () => {
        console.log('🔒 Starting verification process...');
        setShowVerification(true);
        setVerificationError(null);
    };

    // Handle vote submission
    const handleVote = (candidateId) => {
        console.log('🗳️ handleVote called for candidate:', candidateId);
        console.log('👤 Voter status:', { voteStatus: voter.voteStatus, isVerified, verificationId });
        
        // Check if user has already voted
        if (voter.voteStatus) {
            console.log('❌ User has already voted');
            alert("You Have Already Voted");
            return;
        }

        // Check if user is verified
        if (!isVerified) {
            console.log('🔒 User not verified, starting verification...');
            startVerification();
            return;
        }

        console.log('✅ User is verified, processing vote...');
        
        // Simulate vote submission
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setVoter({ ...voter, voteStatus: true });
            alert(`Vote submitted successfully for candidate ${candidateId}!`);
        }, 2000);
    };

    // Render verification component
    if (showVerification) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Voter Verification Required
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Please complete the verification process to vote.
                </Typography>
                
                {verificationError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {verificationError}
                    </Alert>
                )}
                
                <VerifyVoter onVerificationComplete={handleVerificationComplete} />
                
                <Button 
                    variant="outlined" 
                    onClick={() => setShowVerification(false)}
                    sx={{ mt: 2 }}
                >
                    Cancel Verification
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                🗳️ Online Voting System
            </Typography>
            
            {/* Verification Status */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: isVerified ? '#d4edda' : '#f8d7da' }}>
                <Typography variant="h6" sx={{ color: isVerified ? '#155724' : '#721c24' }}>
                    Verification Status: {isVerified ? '✅ Verified' : '❌ Not Verified'}
                </Typography>
                {isVerified && verificationId && (
                    <Typography variant="body2" sx={{ color: '#155724' }}>
                        Verification ID: {verificationId}
                    </Typography>
                )}
                {!isVerified && (
                    <Typography variant="body2" sx={{ color: '#721c24' }}>
                        You must complete verification before voting.
                    </Typography>
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
                <Paper key={election.id} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        {election.title}
                    </Typography>
                    
                    <Grid container spacing={3}>
                        {election.candidates.map((candidate) => (
                            <Grid item xs={12} sm={6} md={4} key={candidate.id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 120,
                                                height: 120,
                                                backgroundColor: '#f0f0f0',
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
                                        <Typography variant="h6" gutterBottom>
                                            {candidate.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {candidate.party}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleVote(candidate.id)}
                                            disabled={loading || voter.voteStatus}
                                            sx={{ minWidth: 120 }}
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
        </Box>
    );
};

export default Vote;
