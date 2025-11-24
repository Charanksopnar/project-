import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../helper';
import { CircularProgress, Button, Typography, Box } from '@mui/material';
import { CheckCircle, CameraAlt, ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, PlayArrow } from '@mui/icons-material';
import './IdVerification.css';

const LivenessCheck = ({ voterId, onComplete }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [step, setStep] = useState('initial'); // initial, front, left, right, top, bottom, submitting, complete
    const [images, setImages] = useState({
        front: null,
        left: null,
        right: null,
        top: null,
        bottom: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError("Unable to access camera. Please allow camera permissions.");
            console.error("Camera error:", err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, 640, 480);
            canvasRef.current.toBlob((blob) => {
                const currentStep = step;
                setImages(prev => ({ ...prev, [currentStep]: blob }));

                if (currentStep === 'front') setStep('left');
                else if (currentStep === 'left') setStep('right');
                else if (currentStep === 'right') setStep('top');
                else if (currentStep === 'top') setStep('bottom');
                else if (currentStep === 'bottom') {
                    submitAllImages({ ...images, bottom: blob });
                }
            }, 'image/jpeg', 0.9);
        }
    };

    const submitAllImages = async (finalImages) => {
        setStep('submitting');
        setLoading(true);

        const formData = new FormData();
        formData.append('voterId', voterId);
        formData.append('front', finalImages.front, 'front.jpg');
        formData.append('left', finalImages.left, 'left.jpg');
        formData.append('right', finalImages.right, 'right.jpg');
        formData.append('top', finalImages.top, 'top.jpg');
        formData.append('bottom', finalImages.bottom, 'bottom.jpg');

        try {
            await axios.post(`${BASE_URL}/api/security/submit-liveness`, formData);
            setStep('complete');
            setLoading(false);
            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (err) {
            setError("Failed to submit liveness data. Please try again.");
            setLoading(false);
            setStep('initial');
        }
    };

    const getInstruction = () => {
        switch (step) {
            case 'initial': return "Position your face in the frame. Ensure good lighting.";
            case 'front': return "Look Straight Ahead";
            case 'left': return "Turn head LEFT";
            case 'right': return "Turn head RIGHT";
            case 'top': return "Look UP";
            case 'bottom': return "Look DOWN";
            case 'submitting': return "Verifying biometrics...";
            case 'complete': return "Face Enrollment Successful";
            default: return "";
        }
    };

    const getIcon = () => {
        switch (step) {
            case 'front': return <CameraAlt />;
            case 'left': return <ArrowBack />;
            case 'right': return <ArrowForward />;
            case 'top': return <ArrowUpward />;
            case 'bottom': return <ArrowDownward />;
            default: return <CameraAlt />;
        }
    };

    const steps = ['front', 'left', 'right', 'top', 'bottom'];
    const currentStepIndex = steps.indexOf(step);

    if (error) {
        return (
            <div className="liveness-container error">
                <Typography color="error" variant="h6">{error}</Typography>
                <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="liveness-container">
            <h3>Face Enrollment</h3>
            <Typography variant="body2" color="textSecondary" gutterBottom>
                Please capture your face from multiple angles for secure voting.
            </Typography>

            <div className="camera-wrapper">
                <video ref={videoRef} autoPlay playsInline muted className="liveness-video" />
                <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />

                <div className="overlay-guide">
                    <div className={`face-frame ${step === 'submitting' ? 'complete' : step}`}></div>
                </div>
            </div>

            <div className="instruction-panel">
                <div className="progress-dots">
                    {steps.map((s, index) => (
                        <div
                            key={s}
                            className={`dot ${index < currentStepIndex ? 'completed' : index === currentStepIndex ? 'active' : ''}`}
                        />
                    ))}
                </div>

                <div className="instruction-text">
                    {step === 'submitting' && <CircularProgress size={24} style={{ marginRight: 10 }} />}
                    {step === 'complete' && <CheckCircle color="success" style={{ marginRight: 10 }} />}
                    {getInstruction()}
                </div>

                {step === 'initial' && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setStep('front')}
                        startIcon={<PlayArrow />}
                        size="large"
                        className="capture-btn"
                    >
                        Start Enrollment
                    </Button>
                )}

                {steps.includes(step) && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCapture}
                        startIcon={getIcon()}
                        size="large"
                        className="capture-btn"
                    >
                        Capture & Continue
                    </Button>
                )}
            </div>
        </div>
    );
};

export default LivenessCheck;
