import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Alert, Fade } from '@mui/material';
import { Warning } from '@mui/icons-material';

const VotingSecurityMonitor = ({ voterId, electionId, onWarning, onBlock }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [violationCount, setViolationCount] = useState(0);
    const [currentWarning, setCurrentWarning] = useState(null);
    const [isMonitoring, setIsMonitoring] = useState(true);

    useEffect(() => {
        startCamera();
        const intervalId = setInterval(checkSecurity, 3000); // Check every 3 seconds

        return () => {
            clearInterval(intervalId);
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            onWarning("Camera access required for voting security.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    const checkSecurity = async () => {
        if (!videoRef.current || !canvasRef.current || !isMonitoring) return;

        const context = canvasRef.current.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, 320, 240);

        canvasRef.current.toBlob(async (blob) => {
            if (!blob) return;

            const formData = new FormData();
            formData.append('frame', blob);
            formData.append('voterId', voterId);
            formData.append('electionId', electionId);

            try {
                const res = await axios.post('/api/security/voting-session-check', formData);

                if (res.data.violation) {
                    handleViolation(res.data.violationType, res.data.message);
                } else {
                    // Clear warning if check passes
                    setCurrentWarning(null);
                }
            } catch (err) {
                console.error("Security check failed:", err);
            }
        }, 'image/jpeg', 0.7);
    };

    const handleViolation = (type, message) => {
        const newCount = violationCount + 1;
        setViolationCount(newCount);

        let warningMsg = "";

        if (newCount === 1) {
            warningMsg = `Warning 1: ${message}. Please follow the rules.`;
            setCurrentWarning({ message: warningMsg, severity: 'warning' });
            if (onWarning) onWarning(warningMsg);
        } else if (newCount === 2) {
            warningMsg = `Warning 2: ${message}. Next violation will block your vote.`;
            setCurrentWarning({ message: warningMsg, severity: 'error' });
            if (onWarning) onWarning(warningMsg);
        } else if (newCount >= 3) {
            warningMsg = "Maximum violations reached. Voting blocked.";
            setIsMonitoring(false);
            if (onBlock) onBlock({ reason: type, count: newCount });
        }
    };

    return (
        <Box sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9999,
            width: 200,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 2,
            overflow: 'hidden',
            border: currentWarning ? `2px solid ${currentWarning.severity === 'error' ? 'red' : 'orange'}` : 'none'
        }}>
            <Box sx={{ position: 'relative' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', display: 'block' }}
                />
                <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />

                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    p: 0.5,
                    fontSize: '0.75rem',
                    textAlign: 'center'
                }}>
                    Security Active
                </Box>
            </Box>

            <Fade in={!!currentWarning}>
                <Alert
                    severity={currentWarning?.severity || 'warning'}
                    variant="filled"
                    sx={{
                        borderRadius: 0,
                        fontSize: '0.75rem',
                        py: 0
                    }}
                >
                    {currentWarning?.message}
                </Alert>
            </Fade>
        </Box>
    );
};

export default VotingSecurityMonitor;
