import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
import * as faceapi from 'face-api.js';
import { browserCompatibility, checkBrowserCompatibility } from '../../../../utils/browserCompatibility';
import { faceDetectionManager, detectFacesInVideo, processFaceDetectionHistory } from '../../../../utils/faceDetectionUtils';

const MonitoringPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  textAlign: 'center',
  borderRadius: '10px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
}));

const VideoContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  maxHeight: '300px',
  borderRadius: '5px',
  backgroundColor: '#f0f0f0',
  overflow: 'hidden'
});

const VideoPreview = styled('video')({
  width: '100%',
  maxHeight: '300px',
  borderRadius: '5px',
  backgroundColor: '#f0f0f0',
  transform: 'scaleX(-1)' // Mirror the video horizontally
});

const AudioVisualizer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '50px',
  backgroundColor: '#f0f0f0',
  borderRadius: '5px',
  position: 'relative',
  overflow: 'hidden',
  marginTop: theme.spacing(2)
}));

const AudioBar = styled(Box)(({ level, theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  height: `${level}%`,
  backgroundColor: level > 70 ? theme.palette.error.main : theme.palette.primary.main,
  transition: 'height 0.1s ease-in-out'
}));

const SecurityStatus = styled(Box)(({ status, theme }) => ({
  padding: theme.spacing(1),
  borderRadius: '5px',
  backgroundColor:
    status === 'secure' ? theme.palette.success.light :
    status === 'warning' ? theme.palette.warning.light :
    theme.palette.error.light,
  color:
    status === 'secure' ? theme.palette.success.dark :
    status === 'warning' ? theme.palette.warning.dark :
    theme.palette.error.dark,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: theme.spacing(2)
}));

const SecureVotingSession = ({ onVotingComplete, candidateId, onSecurityViolation }) => {
  // Refs for media elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // State variables
  const [isInitializing, setIsInitializing] = useState(true);
  const [securityStatus, setSecurityStatus] = useState('initializing');
  const [securityMessage, setSecurityMessage] = useState('Initializing secure voting session...');
  const [audioLevel, setAudioLevel] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [fraudDetected, setFraudDetected] = useState(false);
  const [votingProgress, setVotingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [compatibilityChecked, setCompatibilityChecked] = useState(false);
  const [compatibilityReport, setCompatibilityReport] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // State for face detection models
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Monitoring intervals
  const monitoringIntervalRef = useRef(null);
  const audioMonitoringRef = useRef(null);

  // Enhanced initialization with compatibility check
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsInitializing(true);
        setSecurityMessage('Checking browser compatibility...');

        // Check browser compatibility first
        const { results, report } = await checkBrowserCompatibility();
        setCompatibilityReport(report);
        setCompatibilityChecked(true);

        if (!report.compatible) {
          setError('Your browser or device is not compatible with secure voting. Please use a supported browser.');
          setShowErrorDialog(true);
          setIsInitializing(false);
          return;
        }

        if (report.warnings.length > 0) {
          console.warn('Compatibility warnings:', report.warnings);
        }

        // Load face detection models using the utility
        setSecurityMessage('Loading face detection models...');
        await faceDetectionManager.loadModels(3);

        setModelsLoaded(true);
        console.log('Initialization completed successfully');

      } catch (error) {
        console.error('Error during initialization:', error);
        setError('Failed to initialize secure voting session. Please refresh the page and try again.');
        setShowErrorDialog(true);
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, []);



  // Initialize media streams and monitoring
  useEffect(() => {
    // Only proceed if models are loaded and compatibility is checked
    if (!modelsLoaded || !compatibilityChecked) return;

    const initializeMedia = async () => {
      try {
        setSecurityMessage('Requesting camera and microphone access...');

        // Enhanced media constraints with fallback
        const constraints = await getOptimalMediaConstraints();
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        streamRef.current = stream;

        // Enhanced video setup
        if (videoRef.current) {
          await setupVideoElement(videoRef.current, stream);
        }

        // Set up audio analysis with error handling
        await setupAudioAnalysis(stream);

        // Set up media recording with error handling
        await setupMediaRecording(stream);

        // Start monitoring
        startMonitoring();

        setIsInitializing(false);
        setSecurityStatus('secure');
        setSecurityMessage('Secure voting session established. Please maintain a clear view of your face.');

        // Start voting progress simulation
        startVotingProgress();

      } catch (error) {
        console.error('Error initializing media:', error);
        handleMediaError(error);
      }
    };

    initializeMedia();

    // Cleanup function
    return () => {
      cleanupMediaResources();
    };
  }, [modelsLoaded, compatibilityChecked]);

  // Enhanced cleanup function
  const cleanupMediaResources = () => {
    // Clear monitoring intervals
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    if (audioMonitoringRef.current) {
      clearInterval(audioMonitoringRef.current);
      audioMonitoringRef.current = null;
    }

    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
  };

  // Get optimal media constraints based on device capabilities
  const getOptimalMediaConstraints = async () => {
    const baseConstraints = {
      video: {
        width: { ideal: 640, min: 320 },
        height: { ideal: 480, min: 240 },
        facingMode: 'user',
        frameRate: { ideal: 30, min: 15 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };

    // Fallback constraints for compatibility
    if (retryAttempts > 0) {
      return {
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 }
        },
        audio: true
      };
    }

    return baseConstraints;
  };

  // Enhanced video element setup
  const setupVideoElement = (videoElement, stream) => {
    return new Promise((resolve, reject) => {
      videoElement.srcObject = stream;

      videoElement.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        videoElement.play()
          .then(() => {
            console.log('Video playing successfully');
            resolve();
          })
          .catch(reject);
      };

      videoElement.onerror = (error) => {
        console.error('Video element error:', error);
        reject(new Error('Failed to load video'));
      };

      // Set video attributes
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;
    });
  };

  // Enhanced audio analysis setup
  const setupAudioAnalysis = async (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      console.log('Audio analysis setup completed');
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
      throw new Error('Failed to setup audio monitoring');
    }
  };

  // Enhanced media recording setup
  const setupMediaRecording = async (stream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        setSecurityStatus('warning');
        setSecurityMessage('Recording error detected. Session integrity may be compromised.');
      };

      mediaRecorder.start(1000); // Collect data every second
      console.log('Media recording setup completed');
    } catch (error) {
      console.error('Error setting up media recording:', error);
      throw new Error('Failed to setup session recording');
    }
  };

  // Enhanced error handling for media initialization
  const handleMediaError = (error) => {
    const errorMessage = browserCompatibility.getCameraErrorMessage(error);
    setError(errorMessage);
    setShowErrorDialog(true);
    setIsInitializing(false);

    // Offer retry with basic constraints for certain errors
    if (error.name === 'OverconstrainedError' && retryAttempts < 2) {
      console.log('Retrying with basic constraints...');
      setRetryAttempts(prev => prev + 1);
      setSecurityMessage('Retrying with basic settings...');
      setTimeout(() => {
        setIsInitializing(true);
        // This will trigger the useEffect again
      }, 2000);
    }
  };

  // Function to start monitoring audio and video
  const startMonitoring = () => {
    // Monitor audio levels and patterns
    const audioMonitoringInterval = setInterval(() => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume level
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(100, Math.max(0, average * 100 / 256));
        setAudioLevel(normalizedLevel);

        // Store historical audio data for pattern analysis
        const audioHistory = window.audioHistory || [];
        if (audioHistory.length > 20) {
          audioHistory.shift(); // Remove oldest data point
        }
        audioHistory.push(normalizedLevel);
        window.audioHistory = audioHistory;

        // Analyze audio patterns for multiple voices
        if (audioHistory.length >= 10) {
          // Calculate variance in audio levels (high variance can indicate multiple speakers)
          const mean = audioHistory.reduce((sum, val) => sum + val, 0) / audioHistory.length;
          const variance = audioHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / audioHistory.length;

          // Count rapid transitions in audio levels (can indicate speaker changes)
          let transitions = 0;
          for (let i = 1; i < audioHistory.length; i++) {
            const diff = Math.abs(audioHistory[i] - audioHistory[i-1]);
            if (diff > 20) { // Threshold for significant change
              transitions++;
            }
          }

          // Detect potential multiple voices
          if (variance > 300 || transitions > 3) {
            // Severe audio pattern anomalies indicate multiple people - treat as violation
            handleSecurityViolation(
              'Multiple voices detected. Voting session will be terminated.',
              'multiple_voices'
            );
          } else if (normalizedLevel > 70) {
            // High audio levels are just a warning
            handleSecurityWarning('High audio levels detected. Please ensure you are alone while voting.');
          }
        }
      }
    }, 100);

    // Monitor video for face detection
    const videoMonitoringInterval = setInterval(async () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        // Save the current context state
        context.save();

        // Mirror the canvas context horizontally to match the mirrored video display
        context.translate(canvasRef.current.width, 0);
        context.scale(-1, 1);

        // Draw the mirrored video
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        // Restore the context to its original state
        context.restore();

        try {
          // Use enhanced face detection utility
          const detectionResult = await detectFacesInVideo(videoRef.current, {
            inputSize: 320,
            scoreThreshold: 0.5
          });

          if (detectionResult.success) {
            const { detections, faceCount, multipleFaces, noFace } = detectionResult;

            // Update state with detection results
            setFaceDetected(!noFace);
            setMultipleFaces(multipleFaces);

            // Process detection history for fraud analysis
            const historyResult = faceDetectionManager.processFaceDetectionHistory(detectionResult);
            setFraudDetected(historyResult.analysis.fraudDetected);

            // Draw face detection boxes on the canvas
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            // Draw boxes around detected faces
            if (detections.length > 0) {
              // Need to adjust for the mirrored video
              context.save();
              context.scale(-1, 1);
              context.translate(-canvasRef.current.width, 0);

              detections.forEach(detection => {
                const box = detection.box;
                // Draw rectangle
                context.strokeStyle = multipleFaces ? 'red' : 'green';
                context.lineWidth = 3;
                context.strokeRect(box.x, box.y, box.width, box.height);

                // Add label
                context.fillStyle = multipleFaces ? 'red' : 'green';
                context.font = '16px Arial';
                context.fillText(multipleFaces ? 'Multiple Faces!' : 'Face Detected', box.x, box.y - 5);
              });

              context.restore();
            }

            // Handle face detection results
            if (noFace) {
              handleSecurityWarning('No face detected. Please ensure your face is clearly visible.');
            } else if (multipleFaces) {
              handleSecurityViolation(
                'Multiple faces detected. Voting session will be terminated.',
                'multiple_faces'
              );
            }

            // Handle fraud detection results
            if (historyResult.analysis.fraudDetected) {
              handleSecurityViolation(
                'Suspicious behavior detected. Potential fraud attempt identified.',
                'fraud_detection'
              );
            }
          } else {
            console.warn('Face detection failed:', detectionResult.error);
          }
        } catch (error) {
          console.error('Error during face detection:', error);
          // If face detection fails, don't update the state
          // This prevents false positives/negatives due to errors
        }
      }
    }, 500);

    // Cleanup intervals on component unmount
    return () => {
      clearInterval(audioMonitoringInterval);
      clearInterval(videoMonitoringInterval);
    };
  };

  // Process face detection history for fraud analysis
  const processFaceDetectionHistory = (faceDetected, multipleFaces, faceCount) => {
    // Initialize video frame history if it doesn't exist
    window.videoFrameHistory = window.videoFrameHistory || {
      frames: [],
      faceCountHistory: [],
      suspiciousPatterns: 0,
      lastAnalysisTime: 0
    };

    const history = window.videoFrameHistory;

    // Add to detection history
    const now = Date.now();
    history.faceCountHistory.push({
      timestamp: now,
      faceCount: faceCount
    });

    // Limit history size
    if (history.faceCountHistory.length > 30) {
      history.faceCountHistory.shift();
    }

    // Analyze for fraud patterns every 3 seconds
    let fraudDetected = false;
    if (now - history.lastAnalysisTime > 3000 && history.faceCountHistory.length >= 5) {
      history.lastAnalysisTime = now;

      // Check for suspicious patterns

      // Pattern 1: Rapid changes in face count
      let faceCountChanges = 0;
      for (let i = 1; i < history.faceCountHistory.length; i++) {
        if (history.faceCountHistory[i].faceCount !== history.faceCountHistory[i-1].faceCount) {
          faceCountChanges++;
        }
      }

      // Pattern 2: Periodic disappearance of faces
      let periodicDisappearances = 0;
      let noFaceCount = 0;
      for (let i = 0; i < history.faceCountHistory.length; i++) {
        if (history.faceCountHistory[i].faceCount === 0) {
          noFaceCount++;
        } else if (noFaceCount > 0) {
          periodicDisappearances++;
          noFaceCount = 0;
        }
      }

      // Calculate suspicion score
      const rapidChangeThreshold = history.faceCountHistory.length * 0.3;
      const suspiciousScore =
        (faceCountChanges > rapidChangeThreshold ? 1 : 0) +
        (periodicDisappearances >= 2 ? 1 : 0);

      // Update suspicious pattern count
      if (suspiciousScore >= 1) {
        history.suspiciousPatterns++;
      } else {
        history.suspiciousPatterns = Math.max(0, history.suspiciousPatterns - 0.5);
      }

      // Determine if fraud is detected
      fraudDetected = history.suspiciousPatterns >= 3;
    } else {
      // Use existing fraud detection status
      fraudDetected = history.suspiciousPatterns >= 3;
    }

    return {
      faceDetected,
      multipleFaces,
      faceCount,
      fraudDetected
    };
  };

  // Handle security warnings
  const handleSecurityWarning = (message) => {
    setSecurityStatus('warning');
    setSecurityMessage(message);
  };

  // Handle security violations
  const handleSecurityViolation = (message, violationType = 'other') => {
    setSecurityStatus('violation');
    setSecurityMessage(message);
    setShowErrorDialog(true);
    setError(message);

    // Create evidence data (in a real implementation, this would include snapshots, audio clips, etc.)
    const evidenceData = {
      timestamp: new Date().toISOString(),
      faceDetected: faceDetected,
      multipleFaces: multipleFaces,
      fraudDetected: fraudDetected,
      audioLevel: audioLevel
    };

    // Notify parent component with violation details
    if (onSecurityViolation) {
      onSecurityViolation(message, {
        violationType: violationType,
        violationDetails: message,
        evidenceData: JSON.stringify(evidenceData)
      });
    }
  };

  // Simulate voting progress
  const startVotingProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setVotingProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        handleVotingComplete();
      }
    }, 500);
  };

  // Handle voting completion
  const handleVotingComplete = async () => {
    try {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Create a blob from recorded chunks
      const blob = new Blob(recordedChunks, { type: 'video/webm' });

      // In a real implementation, you would upload this blob to the server
      // For this demo, we'll simulate a successful vote

      // Check if there were any security violations before completing the vote
      if (securityStatus === 'violation') {
        // If there was a security violation, notify parent component with the violation
        if (onSecurityViolation) {
          onSecurityViolation(securityMessage, {
            violationType: 'security_violation',
            violationDetails: securityMessage,
            evidenceData: JSON.stringify({
              timestamp: new Date().toISOString(),
              faceDetected: faceDetected,
              multipleFaces: multipleFaces,
              fraudDetected: fraudDetected,
              audioLevel: audioLevel
            })
          });
        }
      } else {
        // Only complete the vote if there were no security violations
        if (onVotingComplete) {
          onVotingComplete(candidateId);
        }
      }
    } catch (error) {
      console.error('Error completing vote:', error);
      setError('Failed to complete voting process. Please try again.');
      setShowErrorDialog(true);
    }
  };

  // Handle dialog close
  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Secure Voting Session
      </Typography>

      <Typography variant="body1" paragraph align="center">
        Please remain in view of the camera until your vote is complete. The system is monitoring for security purposes.
      </Typography>

      {error && !showErrorDialog && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <MonitoringPaper>
            <Typography variant="h6" gutterBottom>
              Video Monitoring
            </Typography>

            <VideoContainer>
              <VideoPreview
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 10,
                  pointerEvents: 'none' // Allow clicks to pass through
                }}
              />
            </VideoContainer>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ mb: 1, mr: 2 }}>
                Face Detected: {faceDetected ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body2" color={multipleFaces ? 'error' : 'inherit'} sx={{ mb: 1 }}>
                Multiple Faces: {multipleFaces ? 'Yes (Violation)' : 'No'}
              </Typography>
              <Typography variant="body2" color={fraudDetected ? 'error' : 'inherit'} sx={{ width: '100%' }}>
                Fraud Detection: {fraudDetected ? 'Suspicious Activity Detected' : 'No Suspicious Activity'}
              </Typography>
              {!modelsLoaded && (
                <Typography variant="body2" color="warning.main" sx={{ width: '100%', mt: 1 }}>
                  Face detection models are loading...
                </Typography>
              )}
              {isInitializing && (
                <Typography variant="body2" color="info.main" sx={{ width: '100%', mt: 1 }}>
                  Initializing security features...
                </Typography>
              )}
            </Box>
          </MonitoringPaper>
        </Grid>

        <Grid item xs={12} md={4}>
          <MonitoringPaper>
            <Typography variant="h6" gutterBottom>
              Audio Monitoring
            </Typography>

            <AudioVisualizer>
              <AudioBar level={audioLevel} />
            </AudioVisualizer>

            <Typography variant="body2" sx={{ mt: 1 }}>
              Audio Level: {Math.round(audioLevel)}%
            </Typography>

            {audioLevel > 70 && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                High audio levels detected
              </Typography>
            )}
          </MonitoringPaper>

          <SecurityStatus status={securityStatus}>
            <Typography variant="body2" fontWeight="bold">
              {securityStatus === 'secure' ? 'SECURE' :
               securityStatus === 'warning' ? 'WARNING' : 'VIOLATION'}
            </Typography>
          </SecurityStatus>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Voting Progress:
            </Typography>
            <LinearProgress
              variant="determinate"
              value={votingProgress}
              color={securityStatus === 'secure' ? 'primary' :
                    securityStatus === 'warning' ? 'warning' : 'error'}
            />
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              {votingProgress}%
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" fontWeight="bold">
          Security Message:
        </Typography>
        <Typography variant="body2">
          {securityMessage}
        </Typography>
      </Box>

      <Dialog
        open={showErrorDialog}
        onClose={handleCloseErrorDialog}
      >
        <DialogTitle>
          Security Alert
        </DialogTitle>
        <DialogContent>
          <Typography>
            {error}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecureVotingSession;
