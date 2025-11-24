import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
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
// You can still use face-api.js & your utils later for pose/head-direction etc.
import * as faceapi from 'face-api.js';
import { browserCompatibility, checkBrowserCompatibility } from '../../../../utils/browserCompatibility';
// NOTE: removed processFaceDetectionHistory from import to avoid name clash
import { faceDetectionManager, detectFacesInVideo } from '../../../../utils/faceDetectionUtils';

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

const SecureVotingSession = ({
  onVotingComplete,
  candidateId,
  onSecurityViolation,
  voterId,
  electionId,
  onCancel
}) => {
  // Media refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // Interval refs
  const audioMonitoringRef = useRef(null);
  const videoMonitoringRef = useRef(null);

  // History refs (no globals on window)
  const audioHistoryRef = useRef([]);
  const videoHistoryRef = useRef({
    faceCountHistory: [],
    suspiciousPatterns: 0,
    lastAnalysisTime: 0
  });

  // Warning counters: 2 warnings, 3rd = block for audio multiple voices
  const warningCountersRef = useRef({
    multipleVoices: 0
  });

  // State
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
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // ---- INITIAL PHASE: Browser + model check ----
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsInitializing(true);
        setSecurityStatus('initializing');
        setSecurityMessage('Checking browser compatibility...');

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

        setSecurityMessage('Loading face detection models (you can still vote if this fails)...');

        try {
          await faceDetectionManager.loadModels(2);
          setModelsLoaded(true);
          console.log('Face detection models loaded successfully');
          setSecurityMessage('Face detection ready. Requesting camera and microphone access...');
        } catch (err) {
          console.warn('Face detection models failed to load, proceeding without advanced face analysis:', err);
          setModelsLoaded(false);
          setSecurityMessage('Advanced face detection unavailable. Basic video monitoring will be used.');
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to initialize secure voting session. Please refresh the page and try again.');
        setShowErrorDialog(true);
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, []);

  // ---- SECOND PHASE: Camera + mic request ----
  useEffect(() => {
    if (!compatibilityChecked) return;

    const initializeMedia = async () => {
      try {
        setSecurityMessage('Requesting camera and microphone access...');
        const constraints = await getOptimalMediaConstraints();
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        streamRef.current = stream;

        if (videoRef.current) {
          await setupVideoElement(videoRef.current, stream);
        }

        await setupAudioAnalysis(stream);
        await setupMediaRecording(stream);
        startMonitoring(); // audio + video monitoring

        setIsInitializing(false);
        setSecurityStatus('secure');
        setSecurityMessage(
          modelsLoaded
            ? 'Secure voting session established. Please keep your face clearly visible.'
            : 'Secure voting session established (advanced face detection disabled). Please keep your face clearly visible.'
        );

        startVotingProgress();
      } catch (err) {
        console.error('Error initializing media:', err);
        handleMediaError(err);
      }
    };

    initializeMedia();

    // Cleanup on unmount
    return () => {
      cleanupMediaResources();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compatibilityChecked]);

  // ---- Helper: Cleanup media & intervals ----
  const cleanupMediaResources = () => {
    if (audioMonitoringRef.current) {
      clearInterval(audioMonitoringRef.current);
      audioMonitoringRef.current = null;
    }
    if (videoMonitoringRef.current) {
      clearInterval(videoMonitoringRef.current);
      videoMonitoringRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
  };

  // ---- Helper: constraints with fallbacks ----
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

    if (retryAttempts === 1) {
      return {
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: true
      };
    }

    if (retryAttempts >= 2) {
      return {
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false
      };
    }

    return baseConstraints;
  };

  // ---- Video setup ----
  const setupVideoElement = (videoElement, stream) => {
    return new Promise((resolve, reject) => {
      videoElement.srcObject = stream;

      videoElement.onloadedmetadata = () => {
        videoElement.play()
          .then(() => {
            console.log('Video playing successfully');
            resolve();
          })
          .catch(reject);
      };

      videoElement.onerror = (err) => {
        console.error('Video element error:', err);
        reject(new Error('Failed to load video'));
      };

      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;
    });
  };

  // ---- Audio analysis ----
  const setupAudioAnalysis = async (stream) => {
    if (stream.getAudioTracks().length === 0) {
      console.warn('No audio tracks available. Audio monitoring disabled.');
      setSecurityMessage(prev => prev + ' (Audio monitoring disabled)');
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      console.log('Audio analysis setup completed');
    } catch (err) {
      console.error('Error setting up audio analysis:', err);
      setSecurityMessage(prev => prev + ' (Audio monitoring failed)');
    }
  };

  // ---- Media recording ----
  const setupMediaRecording = async (stream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onerror = (err) => {
        console.error('MediaRecorder error:', err);
        setSecurityStatus('warning');
        setSecurityMessage('Recording error detected. Session integrity may be compromised.');
      };

      mediaRecorder.start(1000);
      console.log('Media recording setup completed');
    } catch (err) {
      console.error('Error setting up media recording:', err);
      throw new Error('Failed to setup session recording');
    }
  };

  // ---- Browser-specific instructions ----
  const getBrowserSpecificInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return '📌 Chrome: Click the camera icon in the address bar, then select "Allow" for camera and microphone.';
    } else if (userAgent.includes('firefox')) {
      return '📌 Firefox: Click the camera icon in the address bar, then select "Allow" for camera and microphone.';
    } else if (userAgent.includes('edg')) {
      return '📌 Edge: Click the camera icon in the address bar, then select "Allow" for camera and microphone.';
    } else if (userAgent.includes('safari')) {
      return '📌 Safari: Go to Safari > Settings > Websites > Camera/Microphone, then allow access for this site.';
    }

    return '📌 Please check your browser settings to allow camera and microphone access for this website.';
  };

  // ---- Media error + retries ----
  const handleMediaError = (err) => {
    let errorMessage = browserCompatibility.getCameraErrorMessage(err);
    const browserInstructions = getBrowserSpecificInstructions();
    if (browserInstructions) {
      errorMessage += '\n\n' + browserInstructions;
    }

    setError(errorMessage);
    setShowErrorDialog(true);
    setIsInitializing(false);

    if (retryAttempts < 3) {
      console.log(`Retrying initialization (attempt ${retryAttempts + 1})...`);
      setRetryAttempts(prev => prev + 1);
      setSecurityMessage('Retrying with adjusted settings...');

      setTimeout(() => {
        setIsInitializing(true);
        setShowErrorDialog(false);
        setError(null);
        // trigger media re-init by toggling compatibility flag
        setCompatibilityChecked(false);
        setTimeout(() => setCompatibilityChecked(true), 50);
      }, 1500);
    } else {
      console.warn('All media attempts failed. Falling back to simulation mode.');
      setSecurityMessage('Camera access failed. Proceeding in simulation mode (your vote may be reviewed).');
      setShowErrorDialog(false);
      setIsInitializing(false);
      setSecurityStatus('warning');
      startVotingProgress();
    }
  };

  const handleRetryPermissions = () => {
    setShowErrorDialog(false);
    setError(null);
    setIsInitializing(true);
    setSecurityMessage('Requesting camera and microphone access...');
    setRetryAttempts(0);
    cleanupMediaResources();
    setCompatibilityChecked(false);
    setTimeout(() => setCompatibilityChecked(true), 50);
  };

  const handleCancelSession = () => {
    cleanupMediaResources();
    if (onCancel) onCancel();
  };

  // ---- Monitoring (audio + video) ----
  const startMonitoring = () => {
    // clear previous intervals if any
    if (audioMonitoringRef.current) clearInterval(audioMonitoringRef.current);
    if (videoMonitoringRef.current) clearInterval(videoMonitoringRef.current);

    // AUDIO
    audioMonitoringRef.current = setInterval(() => {
      if (!analyserRef.current) return;

      const analyser = analyserRef.current;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = Math.min(100, Math.max(0, (average * 100) / 256));
      setAudioLevel(normalizedLevel);

      // maintain history
      const history = audioHistoryRef.current;
      if (history.length > 20) history.shift();
      history.push(normalizedLevel);

      if (history.length >= 10) {
        const mean = history.reduce((sum, val) => sum + val, 0) / history.length;
        const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;

        let transitions = 0;
        for (let i = 1; i < history.length; i++) {
          const diff = Math.abs(history[i] - history[i - 1]);
          if (diff > 20) transitions++;
        }

        // Advanced workflow: 2 warnings, 3rd = block for multiple voices
        if (variance > 300 || transitions > 3) {
          registerWarningOrBlock(
            'multipleVoices',
            'Multiple voices detected. Please ensure you are alone while voting.'
          );
        } else if (normalizedLevel > 70) {
          handleSecurityWarning('High audio levels detected. Please keep background noise low.');
        }
      }
    }, 100);

    // VIDEO
    videoMonitoringRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      context.save();
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      context.restore();

      // OPTIONAL: if you want local face detection (liveness, pose) using face-api:
      // if (modelsLoaded) {
      //   const detections = await detectFacesInVideo(videoRef.current);
      //   const faceCount = detections.length;
      //   const analysis = analyzeFaceDetectionHistory(faceCount);
      //   setFaceDetected(analysis.faceDetected);
      //   setMultipleFaces(analysis.multipleFaces);
      //   setFraudDetected(analysis.fraudDetected);
      // }

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('frame', blob, 'frame.jpg');
        formData.append('voterId', voterId);
        formData.append('electionId', electionId);

        try {
          const response = await axios.post(
            `${BASE_URL}/security/voting-session-check`,
            formData
          );

          const { success, violation, violationType, message, isBlocked } = response.data;

          if (!success) return;

          if (isBlocked) {
            handleSecurityViolation(
              'You have been blocked from voting due to repeated violations.',
              'BLOCKED'
            );
            if (onSecurityViolation) onSecurityViolation('BLOCKED', { isBlocked: true });
            return;
          }

          if (violation) {
            setSecurityStatus('violation');
            setSecurityMessage(message || 'Security violation detected.');
            if (violationType === 'MULTIPLE_FACES') {
              setMultipleFaces(true);
            } else if (violationType === 'FACE_MISMATCH') {
              setFraudDetected(true);
            }

            // Parent can log / notify admin
            if (onSecurityViolation) {
              onSecurityViolation(message, {
                violationType,
                violationDetails: message,
                evidenceData: JSON.stringify({
                  timestamp: new Date().toISOString(),
                  audioLevel,
                  violationType
                })
              });
            }
          } else {
            setSecurityStatus('secure');
            setSecurityMessage('Secure voting session active.');
            setMultipleFaces(false);
            setFraudDetected(false);
            setFaceDetected(true);
          }
        } catch (err) {
          console.error('Security check error:', err);
          // do not spam user with errors here; backend can be slightly flaky
        }
      }, 'image/jpeg', 0.7);
    }, 2000);
  };

  // ---- Local fraud analysis based on face count history (optional) ----
  const analyzeFaceDetectionHistory = (faceCount) => {
    const history = videoHistoryRef.current;
    const now = Date.now();

    history.faceCountHistory.push({ timestamp: now, faceCount });
    if (history.faceCountHistory.length > 30) {
      history.faceCountHistory.shift();
    }

    let fraud = history.suspiciousPatterns >= 3;

    if (now - history.lastAnalysisTime > 3000 && history.faceCountHistory.length >= 5) {
      history.lastAnalysisTime = now;

      let faceCountChanges = 0;
      for (let i = 1; i < history.faceCountHistory.length; i++) {
        if (history.faceCountHistory[i].faceCount !== history.faceCountHistory[i - 1].faceCount) {
          faceCountChanges++;
        }
      }

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

      const rapidChangeThreshold = history.faceCountHistory.length * 0.3;
      const suspiciousScore =
        (faceCountChanges > rapidChangeThreshold ? 1 : 0) +
        (periodicDisappearances >= 2 ? 1 : 0);

      if (suspiciousScore >= 1) {
        history.suspiciousPatterns++;
      } else {
        history.suspiciousPatterns = Math.max(0, history.suspiciousPatterns - 0.5);
      }

      fraud = history.suspiciousPatterns >= 3;
    }

    return {
      faceDetected: faceCount > 0,
      multipleFaces: faceCount > 1,
      fraudDetected: fraud
    };
  };

  // ---- Warning escalation: 2 warnings then block ----
  const registerWarningOrBlock = (type, baseMessage) => {
    const counters = warningCountersRef.current;
    counters[type] = (counters[type] || 0) + 1;
    const count = counters[type];

    if (count <= 2) {
      handleSecurityWarning(`${baseMessage} (Warning ${count} of 2).`);
    } else {
      handleSecurityViolation(
        `${baseMessage} You have violated the rule multiple times and are now blocked from this voting session.`,
        type
      );
    }
  };

  const handleSecurityWarning = (message) => {
    setSecurityStatus('warning');
    setSecurityMessage(message);
  };

  const handleSecurityViolation = (message, violationType = 'other') => {
    setSecurityStatus('violation');
    setSecurityMessage(message);
    setShowErrorDialog(true);
    setError(message);

    const evidenceData = {
      timestamp: new Date().toISOString(),
      faceDetected,
      multipleFaces,
      fraudDetected,
      audioLevel
    };

    if (onSecurityViolation) {
      onSecurityViolation(message, {
        violationType,
        violationDetails: message,
        evidenceData: JSON.stringify(evidenceData)
      });
    }
  };

  // ---- Voting progress ----
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

  const handleVotingComplete = async () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        // TODO: upload blob to server as session evidence if required
      }

      if (securityStatus === 'violation') {
        if (onSecurityViolation) {
          onSecurityViolation(securityMessage, {
            violationType: 'security_violation',
            violationDetails: securityMessage,
            evidenceData: JSON.stringify({
              timestamp: new Date().toISOString(),
              faceDetected,
              multipleFaces,
              fraudDetected,
              audioLevel
            })
          });
        }
      } else if (onVotingComplete) {
        onVotingComplete(candidateId);
      }
    } catch (err) {
      console.error('Error completing vote:', err);
      setError('Failed to complete voting process. Please try again.');
      setShowErrorDialog(true);
    }
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
    if (error) {
      handleCancelSession();
    }
  };

  // ---- RENDER ----
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
              <VideoPreview ref={videoRef} autoPlay playsInline muted />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              />
            </VideoContainer>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ mb: 1, mr: 2 }}>
                Face Detected: {faceDetected ? 'Yes' : 'No'}
              </Typography>
              <Typography
                variant="body2"
                color={multipleFaces ? 'error' : 'inherit'}
                sx={{ mb: 1 }}
              >
                Multiple Faces: {multipleFaces ? 'Yes (Violation)' : 'No'}
              </Typography>
              <Typography
                variant="body2"
                color={fraudDetected ? 'error' : 'inherit'}
                sx={{ width: '100%' }}
              >
                Fraud Detection: {fraudDetected ? 'Suspicious Activity Detected' : 'No Suspicious Activity'}
              </Typography>
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
              {securityStatus === 'secure'
                ? 'SECURE'
                : securityStatus === 'warning'
                  ? 'WARNING'
                  : securityStatus === 'initializing'
                    ? 'INITIALIZING'
                    : 'VIOLATION'}
            </Typography>
          </SecurityStatus>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Voting Progress:
            </Typography>
            <LinearProgress
              variant="determinate"
              value={votingProgress}
              color={
                securityStatus === 'secure'
                  ? 'primary'
                  : securityStatus === 'warning'
                    ? 'warning'
                    : 'error'
              }
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
          ⚠️ Camera/Microphone Access Required
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
            {error}
          </Typography>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Why do we need camera and microphone access?
            </Typography>
            <Typography variant="body2">
              • Verify your identity during voting
              • Detect multiple people or suspicious activity
              • Ensure voting integrity and security
            </Typography>
          </Alert>

          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Your privacy is important. Video and audio are only monitored during the voting session
            and are used solely for security purposes.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleCancelSession}
            variant="outlined"
            color="inherit"
          >
            Cancel Voting
          </Button>
          <Button
            onClick={handleRetryPermissions}
            variant="contained"
            color="primary"
            autoFocus
          >
            Retry Permissions
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecureVotingSession;
