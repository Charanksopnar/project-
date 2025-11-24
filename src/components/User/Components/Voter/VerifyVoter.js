import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Alert } from '@mui/material';

// Import custom hooks
import { useCamera } from './hooks/useCamera';
import { useFaceDetection } from './hooks/useFaceDetection';
import { useAdvancedFaceDetection } from './hooks/useAdvancedFaceDetection';
import { useVerification } from './hooks/useVerification';

// Import components
import VerificationProgress from './components/VerificationProgress';
import IdUploadStep from './components/IdUploadStep';
import VideoVerificationStep from './components/VideoVerificationStep';
import VerificationCompleteStep from './components/VerificationCompleteStep';
import ErrorBoundary from './components/ErrorBoundary';

const VerifyVoter = ({ onVerificationComplete, afterCompleteNavigateTo }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [idImage, setIdImage] = useState(null);
  const [videoFrame, setVideoFrame] = useState(null);
  const [verificationId, setVerificationId] = useState(null);

  // Use custom hooks
  const camera = useCamera();
  const faceDetection = useFaceDetection(camera.videoRef, camera.cameraActive);
  const advancedFaceDetection = useAdvancedFaceDetection(camera.videoRef, camera.cameraActive);
  const verification = useVerification();
  const navigate = useNavigate();

  const handleIdVerificationComplete = (result) => {
    setVerificationId(result.verificationId);
    setCurrentStep(2);
  };

  const handleVideoVerificationComplete = async () => {
    try {
      const result = await verification.verifyVideoFrame(videoFrame, idImage);
      if (result) {
        const finalVerificationId = verification.completeVerification(result);
        setVerificationId(finalVerificationId);
        setCurrentStep(3);
        onVerificationComplete(finalVerificationId);
        // Optional automatic navigation after successful verification
        if (afterCompleteNavigateTo) {
          try { navigate(afterCompleteNavigateTo); } catch (e) { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('Video verification failed:', error);
    }
  };

  const handleCaptureFrame = async () => {
    try {
      const frame = await camera.captureVideoFrame();
      setVideoFrame(frame);
      camera.stopCamera();
    } catch (error) {
      verification.setError(error.message);
    }
  };

  const handleRetakeFrame = () => {
    setVideoFrame(null);
    verification.setError(null);
    camera.startCamera();
  };

  const handleReset = () => {
    setCurrentStep(1);
    setIdImage(null);
    setVideoFrame(null);
    setVerificationId(null);
    camera.stopCamera();
    verification.resetVerification();
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <ErrorBoundary>
      <Box sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
        <VerificationProgress currentStep={currentStep} />

        {verification.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {verification.error}
          </Alert>
        )}

        {currentStep === 1 && (
          <IdUploadStep
            onVerificationComplete={handleIdVerificationComplete}
            loading={verification.loading}
            error={verification.error}
          />
        )}

        {currentStep === 2 && (
          <VideoVerificationStep
            cameraActive={camera.cameraActive}
            videoFrame={videoFrame}
            videoRef={camera.videoRef}
            overlayRef={faceDetection.overlayRef}
            camera={camera}
            onStartCamera={camera.startCamera}
            onStopCamera={camera.stopCamera}
            onCaptureFrame={handleCaptureFrame}
            onRetakeFrame={handleRetakeFrame}
            onVerificationComplete={handleVideoVerificationComplete}
            loading={verification.loading || camera.isLoading}
            error={camera.error || verification.error}
            poseSteps={faceDetection.poseSteps}
            promptIndex={faceDetection.promptIndex}
            liveSimilarity={faceDetection.liveSimilarity}
            onCapturePose={faceDetection.captureCurrentPose}
            capturing={faceDetection.capturing}
            poseDetected={faceDetection.poseDetected}
            advancedPose={advancedFaceDetection.advancedPose}
            mlServiceStatus={advancedFaceDetection.mlServiceStatus}
            isProcessingML={advancedFaceDetection.isProcessing}
          />
        )}

        {currentStep === 3 && (
          <VerificationCompleteStep
            similarityPercentage={verification.similarityPercentage}
            verificationId={verificationId}
          />
        )}

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
          {currentStep > 1 && currentStep < 3 && (
            <Button
              variant="outlined"
              onClick={handlePreviousStep}
              disabled={verification.loading}
            >
              Previous Step
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={verification.loading}
          >
            Reset All
          </Button>
        </Box>

        {/* Information section */}
        {currentStep < 3 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="info.dark" align="center" sx={{ fontWeight: 'bold' }}>
              Step-by-Step Verification Process
            </Typography>
            <Typography variant="body2" color="info.dark" align="center">
              • Complete each step one by one for secure verification
            </Typography>
            <Typography variant="body2" color="info.dark" align="center">
              • Face similarity must be between 60% and 80% for successful verification
            </Typography>
            <Typography variant="body2" color="info.dark" align="center">
              • Only one face should be visible in each image
            </Typography>
          </Box>
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default VerifyVoter;
