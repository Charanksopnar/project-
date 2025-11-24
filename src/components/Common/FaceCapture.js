import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const VideoContainer = styled(Box)({
    position: 'relative',
    width: '100%',
    maxWidth: '640px',
    margin: '0 auto',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    aspectRatio: '4/3',
});

const Video = styled('video')({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)', // Mirror effect
});

const Canvas = styled('canvas')({
    display: 'none',
});

const Controls = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(2),
}));

const FaceCapture = ({ onCapture, label = "Capture Face" }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 },
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please allow camera permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleVideoLoaded = () => {
        setIsReady(true);
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.error("Play error:", e));
        }
    };

    const capture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video to canvas (mirrored)
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to blob/file
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "face_capture.jpg", { type: "image/jpeg" });
                    const imageUrl = URL.createObjectURL(blob);
                    setCapturedImage(imageUrl);
                    if (onCapture) {
                        onCapture(file, imageUrl);
                    }
                    // Stop camera after capture to freeze "frame" (optional, but good for UX)
                    // stopCamera(); // Uncomment if we want to stop stream immediately
                }
            }, 'image/jpeg', 0.95);
        }
    };

    const retake = () => {
        setCapturedImage(null);
        if (!stream) {
            startCamera();
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
            <Typography variant="h6" align="center" gutterBottom>
                {label}
            </Typography>

            {error ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>
                    <Typography>{error}</Typography>
                    <Button onClick={startCamera} sx={{ mt: 2 }} variant="outlined">
                        Retry
                    </Button>
                </Box>
            ) : (
                <>
                    <VideoContainer>
                        {!capturedImage && (
                            <Video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                onLoadedMetadata={handleVideoLoaded}
                            />
                        )}
                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                        {!isReady && !capturedImage && (
                            <Box sx={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white'
                            }}>
                                <CircularProgress color="inherit" />
                            </Box>
                        )}
                    </VideoContainer>
                    <Canvas ref={canvasRef} />

                    <Controls>
                        {!capturedImage ? (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={capture}
                                disabled={!isReady}
                            >
                                Capture Photo
                            </Button>
                        ) : (
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={retake}
                            >
                                Retake
                            </Button>
                        )}
                    </Controls>
                </>
            )}
        </Paper>
    );
};

export default FaceCapture;
