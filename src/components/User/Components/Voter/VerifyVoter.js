import { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Paper, Grid, CircularProgress, Alert, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
// Removed unused browserCompatibility import

const VerificationPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  textAlign: 'center',
  borderRadius: '10px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
}));

const ImagePreview = styled('img')({
  width: '100%',
  maxHeight: '200px',
  objectFit: 'contain',
  marginTop: '10px',
  borderRadius: '5px'
});

const VideoContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  maxHeight: '200px',
  borderRadius: '5px',
  backgroundColor: '#f0f0f0',
  overflow: 'hidden'
});

const VideoPreview = styled('video')({
  width: '100%',
  maxHeight: '200px',
  borderRadius: '5px',
  backgroundColor: '#f0f0f0',
  transform: 'scaleX(-1)' // Mirror the video horizontally
});

const SimilarityMeter = styled(Box)(({ theme, percentage }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1),
  borderRadius: '5px',
  backgroundColor:
    percentage >= 60 && percentage <= 80
      ? theme.palette.success.light
      : theme.palette.error.light,
  color:
    percentage >= 60 && percentage <= 80
      ? theme.palette.success.dark
      : theme.palette.error.dark,
  textAlign: 'center',
  fontWeight: 'bold'
}));

const VerifyVoter = ({ onVerificationComplete }) => {
  const [selfieImage, setSelfieImage] = useState(null);
  const [idImage, setIdImage] = useState(null);
  const [videoFrame, setVideoFrame] = useState(null);
  const [error, setError] = useState(null);
  const [similarityPercentage, setSimilarityPercentage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Step-by-step verification states
  const [currentStep, setCurrentStep] = useState(1); // 1: Selfie, 2: ID, 3: Video, 4: Complete
  const [stepResults, setStepResults] = useState({
    selfie: null,
    id: null,
    video: null
  });
  const [stepLoading, setStepLoading] = useState(false);

  // Refs for video elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize component
  useEffect(() => {
    return () => {
      // Cleanup function to stop camera when component unmounts
      cleanupVideoResources();
    };
  }, []);

  // Enhanced cleanup function
  const cleanupVideoResources = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Reset video element
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setCameraActive(false);
  };

  const startCamera = async (retryWithBasicConstraints = false) => {
    try {
      setError(null); // Clear any previous errors
      console.log('Requesting camera access...');

      // Simple constraints - start with basic and work up
      let constraints;
      if (retryWithBasicConstraints || retryAttempts > 0) {
        constraints = {
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 }
          },
          audio: false
        };
        console.log('Using basic constraints for retry');
      } else {
        constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted:', stream);

      streamRef.current = stream;

      // Simple video setup
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;

        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
              .then(resolve)
              .catch(reject);
          };
          videoRef.current.onerror = reject;
        });
      }

      setCameraActive(true);
      setRetryAttempts(0); // Reset retry counter on success

    } catch (error) {
      console.error('Error accessing camera:', error);

      // Simple error handling
      let errorMessage = 'Failed to access camera. ';

      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'OverconstrainedError' && retryAttempts < 2) {
        console.log('Retrying with basic constraints...');
        setRetryAttempts(prev => prev + 1);
        setTimeout(() => startCamera(true), 1000);
        return;
      } else {
        errorMessage += 'Please check your camera and try again.';
      }

      setError(errorMessage);
    }
  };

  // Removed unused functions

  const stopCamera = () => {
    cleanupVideoResources();
  };

  const captureVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas reference not available');
      setError('Cannot capture frame: video not initialized properly');
      return;
    }

    try {
      console.log('Attempting to capture video frame...');

      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Check if video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video dimensions are zero. Video may not be playing yet.');
        setError('Cannot capture frame: video not ready. Please wait a moment and try again.');
        return;
      }

      console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`);

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');

      // Clear the canvas first
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Mirror the image horizontally to match the mirrored video display
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Reset transformation matrix to default
      context.setTransform(1, 0, 0, 1, 0, 0);

      // Add a visual indicator that the frame was captured
      const captureIndicator = document.createElement('div');
      captureIndicator.style.position = 'absolute';
      captureIndicator.style.top = '0';
      captureIndicator.style.left = '0';
      captureIndicator.style.width = '100%';
      captureIndicator.style.height = '100%';
      captureIndicator.style.backgroundColor = 'white';
      captureIndicator.style.opacity = '0.5';

      // Append to video container and remove after a short flash
      const videoContainer = videoRef.current.parentElement;
      if (videoContainer) {
        videoContainer.appendChild(captureIndicator);
        setTimeout(() => {
          videoContainer.removeChild(captureIndicator);
        }, 150);
      }

      // Convert canvas to blob with higher quality
      canvas.toBlob((blob) => {
        if (blob) {
          console.log(`Captured frame as blob: ${blob.size} bytes`);

          // Create a File object from the blob
          const file = new File([blob], 'video-frame.jpg', { type: 'image/jpeg' });
          setVideoFrame(file);

          // Provide user feedback
          setError(null); // Clear any previous errors

          // Stop the camera after successful capture
          stopCamera();
        } else {
          console.error('Failed to create blob from canvas');
          setError('Failed to capture video frame. Please try again.');
        }
      }, 'image/jpeg', 0.95); // 95% quality
    } catch (error) {
      console.error('Error capturing video frame:', error);
      setError(`Error capturing video frame: ${error.message}`);
    }
  };

  const handleIdImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setIdImage(file);
    }
  };

  const handleSelfieImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelfieImage(file);
    }
  };

  // Step 1: Verify Selfie
  const handleSelfieVerification = async () => {
    if (!selfieImage) {
      setError('Please upload a selfie image first');
      return;
    }

    setStepLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('selfie', selfieImage);
      formData.append('step', 'selfie');

      console.log('Verifying selfie...');

      const response = await axios.post(`${BASE_URL}/verify-voter-step`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setStepResults(prev => ({ ...prev, selfie: response.data }));
        setCurrentStep(2);
        console.log('Selfie verification successful:', response.data);
      } else {
        setError(response.data.message || 'Selfie verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Selfie verification error:', error);
      const errorMessage = error.response?.data?.message || 'Selfie verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setStepLoading(false);
    }
  };

  // Step 2: Verify ID
  const handleIdVerification = async () => {
    if (!idImage) {
      setError('Please upload an ID image first');
      return;
    }

    setStepLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('idImage', idImage);
      formData.append('selfie', selfieImage); // Include selfie for comparison
      formData.append('step', 'id');

      console.log('Verifying ID...');

      const response = await axios.post(`${BASE_URL}/verify-voter-step`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setStepResults(prev => ({ ...prev, id: response.data }));
        setCurrentStep(3);
        console.log('ID verification successful:', response.data);
      } else {
        setError(response.data.message || 'ID verification failed. Please try again.');
      }
    } catch (error) {
      console.error('ID verification error:', error);
      const errorMessage = error.response?.data?.message || 'ID verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setStepLoading(false);
    }
  };

  // Step 3: Verify Video Frame
  const handleVideoVerification = async () => {
    if (!videoFrame) {
      setError('Please capture a video frame first');
      return;
    }

    setStepLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('videoFrame', videoFrame);
      formData.append('selfie', selfieImage); // Include selfie for comparison
      formData.append('idImage', idImage); // Include ID for comparison
      formData.append('step', 'video');

      console.log('Verifying video frame...');

      const response = await axios.post(`${BASE_URL}/verify-voter-step`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        console.log('✅ Video verification successful:', response.data);
        console.log('🔍 Checking verification ID in response:', response.data.verificationId);

        setStepResults(prev => ({ ...prev, video: response.data }));
        setCurrentStep(4);

        // Complete verification
        console.log('🚀 About to call handleCompleteVerification...');
        handleCompleteVerification(response.data);
      } else {
        console.log('❌ Video verification failed:', response.data);
        setError(response.data.message || 'Video verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Video verification error:', error);
      const errorMessage = error.response?.data?.message || 'Video verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setStepLoading(false);
    }
  };

  // Complete verification process
  const handleCompleteVerification = (finalResult) => {
    console.log('🎉 handleCompleteVerification called with:', finalResult);

    setSimilarityPercentage(finalResult.similarityPercentage);

    // Debug logging
    console.log('📋 Verification ID received:', finalResult.verificationId);
    console.log('📊 Similarity percentage:', finalResult.similarityPercentage);

    // Display success message
    const successMessage = `Verification completed successfully! Overall similarity: ${finalResult.similarityPercentage}%`;
    alert(successMessage);

    // Pass verification ID to parent component
    console.log('🔄 Calling onVerificationComplete with ID:', finalResult.verificationId);
    onVerificationComplete(finalResult.verificationId);

    // Stop camera if active
    if (cameraActive) {
      stopCamera();
    }
  };

  // Reset verification process
  const resetVerification = () => {
    setSelfieImage(null);
    setIdImage(null);
    setVideoFrame(null);
    setError(null);
    setSimilarityPercentage(null);
    setCurrentStep(1);
    setStepResults({ selfie: null, id: null, video: null });
    setStepLoading(false);

    if (cameraActive) {
      stopCamera();
    }
  };

  // Removed unused legacy function

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Step 1: Upload Selfie';
      case 2: return 'Step 2: Upload ID Document';
      case 3: return 'Step 3: Live Video Verification';
      case 4: return 'Verification Complete';
      default: return 'Voter Verification';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Please upload a clear selfie photo of yourself.';
      case 2: return 'Upload a government-issued ID document (Aadhar, Voter ID, or Driving License).';
      case 3: return 'Capture a live video frame to complete the verification process.';
      case 4: return 'All verification steps completed successfully!';
      default: return 'Please complete the verification process before voting.';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        {getStepTitle()}
      </Typography>

      <Typography variant="body1" paragraph align="center">
        {getStepDescription()}
      </Typography>

      {/* Progress indicator */}
      <Box sx={{ mb: 4 }}>
        <LinearProgress
          variant="determinate"
          value={(currentStep / 4) * 100}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
          Step {currentStep} of 4
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {similarityPercentage !== null && (
        <SimilarityMeter percentage={similarityPercentage}>
          <Typography variant="body1">
            Face Similarity: {similarityPercentage}%
          </Typography>
          <Typography variant="body2">
            {similarityPercentage >= 60 && similarityPercentage <= 80
              ? 'Match is within acceptable range (60%-80%)'
              : 'Match is outside acceptable range (60%-80%)'}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={similarityPercentage}
            color={similarityPercentage >= 60 && similarityPercentage <= 80 ? "success" : "error"}
            sx={{ mt: 1, height: 10, borderRadius: 5 }}
          />
        </SimilarityMeter>
      )}

      {/* Step-by-step verification */}
      {currentStep === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} mx="auto">
            <VerificationPaper>
              <Typography variant="h6" gutterBottom>
                Upload Your Selfie
              </Typography>
              <Typography variant="body2" paragraph color="text.secondary">
                Please upload a clear photo of yourself. Make sure your face is clearly visible and well-lit.
              </Typography>

              <Box>
                {selfieImage ? (
                  <ImagePreview src={URL.createObjectURL(selfieImage)} alt="Selfie preview" />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #ccc',
                      borderRadius: '5px'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No selfie uploaded yet
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    disabled={stepLoading}
                  >
                    {selfieImage ? 'Change Selfie' : 'Upload Selfie'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleSelfieImageChange}
                    />
                  </Button>

                  {selfieImage && (
                    <Button
                      variant="contained"
                      onClick={handleSelfieVerification}
                      disabled={stepLoading}
                    >
                      {stepLoading ? <CircularProgress size={20} /> : 'Verify Selfie'}
                    </Button>
                  )}
                </Box>
              </Box>
            </VerificationPaper>
          </Grid>
        </Grid>
      )}

      {currentStep === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} mx="auto">
            <VerificationPaper>
              <Typography variant="h6" gutterBottom>
                Upload Your ID Document
              </Typography>
              <Typography variant="body2" paragraph color="text.secondary">
                Please upload a government-issued ID (Aadhar, Voter ID, or Driving License).
                Make sure the photo on your ID is clearly visible.
              </Typography>

              <Box>
                {idImage ? (
                  <ImagePreview src={URL.createObjectURL(idImage)} alt="ID preview" />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #ccc',
                      borderRadius: '5px'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No ID uploaded yet
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    disabled={stepLoading}
                  >
                    {idImage ? 'Change ID' : 'Upload ID'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleIdImageChange}
                    />
                  </Button>

                  {idImage && (
                    <Button
                      variant="contained"
                      onClick={handleIdVerification}
                      disabled={stepLoading}
                    >
                      {stepLoading ? <CircularProgress size={20} /> : 'Verify ID'}
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Show selfie verification result */}
              {stepResults.selfie && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  ✓ Selfie verification completed successfully
                </Alert>
              )}
            </VerificationPaper>
          </Grid>
        </Grid>
      )}

      {currentStep === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} mx="auto">
            <VerificationPaper>
              <Typography variant="h6" gutterBottom>
                Live Video Verification
              </Typography>
              <Typography variant="body2" paragraph color="text.secondary">
                We need to verify that you match your ID in real-time. Please look directly at the camera.
              </Typography>

              <VideoContainer sx={{ position: 'relative' }}>
                {cameraActive ? (
                  <>
                    <VideoPreview
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 5,
                        left: 5,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ color: 'red', fontSize: '8px' }}>●</span> LIVE
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        padding: '4px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}
                    >
                      Look directly at the camera and click "Capture Frame"
                    </Box>
                  </>
                ) : videoFrame ? (
                  <Box sx={{ position: 'relative' }}>
                    <ImagePreview src={URL.createObjectURL(videoFrame)} alt="Video frame preview" />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        backgroundColor: 'rgba(0,128,0,0.7)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      ✓ CAPTURED
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #ccc',
                      borderRadius: '5px',
                      padding: 2
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      No video frame captured yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center">
                      Click "Start Camera" to enable your webcam
                    </Typography>
                  </Box>
                )}
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
              </VideoContainer>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1, flexDirection: 'column', alignItems: 'center' }}>
                {!cameraActive ? (
                  <Button
                    variant="outlined"
                    onClick={startCamera}
                    disabled={stepLoading || videoFrame}
                    startIcon={<span role="img" aria-label="camera">📷</span>}
                    sx={{ minWidth: '180px' }}
                  >
                    {videoFrame ? 'Frame Captured' : 'Start Camera'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      onClick={captureVideoFrame}
                      disabled={stepLoading}
                      color="success"
                      startIcon={<span role="img" aria-label="capture">📸</span>}
                      sx={{
                        minWidth: '180px',
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': {
                          '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)' },
                          '70%': { boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)' },
                          '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' }
                        }
                      }}
                    >
                      Capture Frame
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={stopCamera}
                      disabled={stepLoading}
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {videoFrame && !cameraActive && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setVideoFrame(null);
                        setError(null);
                      }}
                      size="small"
                      disabled={stepLoading}
                    >
                      Retake
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleVideoVerification}
                      disabled={stepLoading}
                    >
                      {stepLoading ? <CircularProgress size={20} /> : 'Complete Verification'}
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Show previous verification results */}
              {stepResults.selfie && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  ✓ Selfie verification completed successfully
                </Alert>
              )}
              {stepResults.id && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  ✓ ID verification completed successfully (Similarity: {stepResults.id.similarityPercentage}%)
                </Alert>
              )}
            </VerificationPaper>
          </Grid>
        </Grid>
      )}

      {/* Step 4: Completion */}
      {currentStep === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} mx="auto">
            <VerificationPaper>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h5" gutterBottom color="success.main">
                  🎉 Verification Complete!
                </Typography>
                <Typography variant="body1" paragraph>
                  All verification steps have been completed successfully.
                </Typography>

                {similarityPercentage && (
                  <SimilarityMeter percentage={similarityPercentage}>
                    <Typography variant="body1">
                      Overall Face Similarity: {similarityPercentage}%
                    </Typography>
                    <Typography variant="body2">
                      {similarityPercentage >= 60 && similarityPercentage <= 80
                        ? 'Match is within acceptable range (60%-80%)'
                        : 'Match is outside acceptable range (60%-80%)'}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={similarityPercentage}
                      color={similarityPercentage >= 60 && similarityPercentage <= 80 ? "success" : "error"}
                      sx={{ mt: 1, height: 10, borderRadius: 5 }}
                    />
                  </SimilarityMeter>
                )}

                <Box sx={{ mt: 3 }}>
                  <Alert severity="success">
                    You can now proceed to vote!
                  </Alert>
                </Box>
              </Box>
            </VerificationPaper>
          </Grid>
        </Grid>
      )}

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
        {currentStep > 1 && currentStep < 4 && (
          <Button
            variant="outlined"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={stepLoading}
          >
            Previous Step
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={resetVerification}
          disabled={stepLoading}
        >
          Reset All
        </Button>
      </Box>

      {/* Information section */}
      {currentStep < 4 && (
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

      {/* Removed compatibility dialog - simplified approach */}
    </Box>
  );
};

export default VerifyVoter;
