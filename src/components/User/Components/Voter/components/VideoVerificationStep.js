import React from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

const VerificationPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  textAlign: 'center',
  borderRadius: '10px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
}));

const VideoContainer = styled(Box)(() => ({
  position: 'relative',
  width: '100%',
  maxHeight: '480px',
  height: '480px',
  borderRadius: '8px',
  backgroundColor: '#000',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #333'
}));

const VideoPreview = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '5px',
  backgroundColor: '#000',
  transform: 'scaleX(-1)',
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 1,
  display: 'block'
});

const FaceDetectionOverlay = styled('canvas')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 2,
  pointerEvents: 'none'
});

const FaceProjectionOverlay = styled(Box)(() => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 200,
  height: 200,
  borderRadius: '50%',
  border: '3px solid rgba(255, 255, 255, 0.8)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(2px)',
  animation: 'pulse 2s infinite ease-in-out',
  '@keyframes pulse': {
    '0%': {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 0.8
    },
    '50%': {
      transform: 'translate(-50%, -50%) scale(1.05)',
      opacity: 1
    },
    '100%': {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 0.8
    }
  }
}));

const DirectionIndicator = styled(Box)(({ direction, active }) => ({
  position: 'absolute',
  top: direction === 'up' ? -60 : direction === 'down' ? 60 : -10,
  left: direction === 'left' ? -60 : direction === 'right' ? 60 : -10,
  right: direction === 'right' ? -60 : 'auto',
  bottom: direction === 'down' ? -60 : 'auto',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: active ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 255, 255, 0.7)',
  border: `2px solid ${active ? '#4caf50' : 'rgba(255, 255, 255, 0.9)'}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  fontWeight: 'bold',
  color: active ? 'white' : '#333',
  transform: active ? 'scale(1.2)' : 'scale(1)',
  transition: 'all 0.3s ease',
  zIndex: 3,
  animation: active ? 'bounce 1s infinite' : 'none',
  '@keyframes bounce': {
    '0%, 20%, 50%, 80%, 100%': {
      transform: direction === 'up' ? 'translateY(0)' :
                 direction === 'down' ? 'translateY(0)' :
                 direction === 'left' ? 'translateX(0)' :
                 'translateX(0)'
    },
    '40%': {
      transform: direction === 'up' ? 'translateY(-10px)' :
                 direction === 'down' ? 'translateY(10px)' :
                 direction === 'left' ? 'translateX(-10px)' :
                 'translateX(10px)'
    },
    '60%': {
      transform: direction === 'up' ? 'translateY(-5px)' :
                 direction === 'down' ? 'translateY(5px)' :
                 direction === 'left' ? 'translateX(-5px)' :
                 'translateX(5px)'
    }
  }
}));

const RecordingIndicator = styled(Box)(({ theme, isRecording }) => ({
  position: 'absolute',
  top: 10,
  right: 10,
  backgroundColor: isRecording ? '#ff4444' : '#00ff00',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  zIndex: 3,
  animation: isRecording ? 'pulse 1s infinite' : 'none',
  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 }
  }
}));

const ImagePreview = styled('img')({
  width: '100%',
  maxHeight: '200px',
  objectFit: 'contain',
  marginTop: '10px',
  borderRadius: '5px'
});

const VideoVerificationStep = ({
  cameraActive,
  videoFrame,
  videoRef,
  overlayRef,
  camera,
  onStartCamera,
  onStopCamera,
  onCaptureFrame,
  onRetakeFrame,
  onVerificationComplete,
  onNext,
  loading,
  error,
  poseSteps,
  promptIndex,
  liveSimilarity,
  onCapturePose,
  capturing,
  poseDetected,
  advancedPose,
  mlServiceStatus,
  isProcessingML
}) => {
  return (
    <VerificationPaper>
      <Typography variant="h6" gutterBottom>
        Live Video Verification
      </Typography>
      <Typography variant="body2" paragraph color="text.secondary">
        We need to verify that you match your ID in real-time. Please look directly at the camera.
      </Typography>

      <VideoContainer>
        {/* Show error prominently if camera failed to start */}
        {error && !cameraActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(244, 67, 54, 0.9)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: '8px',
              p: 3
            }}
          >
            <Typography variant="h6" gutterBottom>
              ❌ Camera Error
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
              {error}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={onStartCamera}
                sx={{ backgroundColor: 'white', color: '#d32f2f', '&:hover': { backgroundColor: '#f5f5f5' } }}
              >
                🔄 Retry Camera
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.open('/camera-test', '_blank')}
                sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
              >
                🔧 Test Camera
              </Button>
            </Box>
          </Box>
        )}

        {cameraActive ? (
          <>
            <VideoPreview
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />

            {/* Face Projection Overlay - Only show when not capturing */}
            {!capturing && (
              <FaceProjectionOverlay>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  🎯
                </Typography>
                <Typography variant="caption" sx={{ color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)', mt: 1 }}>
                  Position Face Here
                </Typography>
              </FaceProjectionOverlay>
            )}

            {/* Directional Animation Indicators */}
            {promptIndex < poseSteps.length && !capturing && (
              <>
                <DirectionIndicator
                  direction="left"
                  active={advancedPose?.pose === 'left' || poseDetected === 'left'}
                >
                  ←
                </DirectionIndicator>
                <DirectionIndicator
                  direction="right"
                  active={advancedPose?.pose === 'right' || poseDetected === 'right'}
                >
                  →
                </DirectionIndicator>
                <DirectionIndicator
                  direction="up"
                  active={advancedPose?.pose === 'up' || poseDetected === 'up'}
                >
                  ↑
                </DirectionIndicator>
                <DirectionIndicator
                  direction="down"
                  active={advancedPose?.pose === 'down' || poseDetected === 'down'}
                >
                  ↓
                </DirectionIndicator>
              </>
            )}

            {/* Recording Status Indicator */}
            <RecordingIndicator isRecording={capturing}>
              <span style={{ color: 'white', fontSize: '10px' }}>
                {capturing ? '●' : '●'}
              </span>
              {capturing ? 'RECORDING' : 'LIVE'}
            </RecordingIndicator>

            {/* Face Detection Quality Indicator */}
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                zIndex: 3,
                cursor: 'pointer'
              }}
              onClick={() => {
                if (camera?.getCameraStatus) {
                  const status = camera.getCameraStatus();
                  console.log('Camera Status:', status);
                  alert(`Camera Status: ${JSON.stringify(status, null, 2)}`);
                }
              }}
              title="Click for camera debug info"
            >
              Face Detection: {liveSimilarity !== null ? `${liveSimilarity}%` : 'Searching...'}
            </Box>

            {/* ML Service Status Indicator */}
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                left: mlServiceStatus === 'connected' ? 200 : 160,
                backgroundColor: mlServiceStatus === 'connected' ? 'rgba(0,128,0,0.8)' : 'rgba(255,165,0,0.8)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '8px' }}>
                {mlServiceStatus === 'connected' ? '🟢' : '🟡'}
              </span>
              ML: {mlServiceStatus === 'connected' ? 'Active' : 'Standby'}
              {isProcessingML && <CircularProgress size={8} color="inherit" />}
            </Box>

            {/* Pose Instructions */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '8px',
                textAlign: 'center',
                zIndex: 3
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                Current Position: <strong>{poseDetected.toUpperCase()}</strong>
              </Typography>
              <Typography variant="caption">
                {promptIndex < poseSteps.length
                  ? `Next: Position your face to the ${poseSteps[promptIndex]} and click "Capture Pose"`
                  : 'All poses captured! Click "Capture Frame" to finish'
                }
              </Typography>
            </Box>

            {/* Face Detection Overlay */}
            <FaceDetectionOverlay
              ref={overlayRef}
            />
          </>
        ) : videoFrame ? (
          <Box sx={{ position: 'relative' }}>
            <ImagePreview src={URL.createObjectURL(videoFrame)} alt="Captured frame" />
            <Box
              sx={{
                position: 'absolute',
                top: 5,
                right: 5,
                backgroundColor: 'rgba(0,128,0,0.8)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                zIndex: 3
              }}
            >
              ✓ CAPTURED
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              border: '2px dashed #ccc',
              borderRadius: '8px'
            }}
          >
            <Box sx={{ textAlign: 'center', p: 3, maxWidth: 400 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                📷 Camera Setup Required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                To complete face verification, you need to:
              </Typography>
              <Box sx={{ textAlign: 'left', mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  1. 📷 Click "Start Camera" below
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  2. 🔓 Allow camera access when prompted by your browser
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  3. 📺 You should see your face on screen
                </Typography>
                <Typography variant="body2">
                  4. 🎯 Follow the pose instructions to complete verification
                </Typography>
              </Box>

              <Typography variant="caption" color="error" sx={{ mb: 2, display: 'block' }}>
                If camera doesn't work, try: <a href="/camera-test" target="_blank">Camera Test Page</a>
              </Typography>

              {/* Debug Button */}
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const status = camera.getCameraStatus();
                  console.log('Camera Status:', status);
                  alert(`Camera Status: ${JSON.stringify(status, null, 2)}`);
                }}
                sx={{ mb: 2, fontSize: '10px' }}
              >
                🔍 Debug Info
              </Button>
              <Button
                variant="contained"
                onClick={onStartCamera}
                startIcon={<span>🎥</span>}
                size="large"
                sx={{
                  backgroundColor: '#1976d2',
                  '&:hover': { backgroundColor: '#1565c0' }
                }}
              >
                Start Camera & Begin Recording
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Make sure you're in a well-lit area and your face is clearly visible
              </Typography>
            </Box>
          </Box>
        )}
      </VideoContainer>

      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        mt: 2,
        gap: 2,
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {!cameraActive ? (
          <Button
            variant="contained"
            size="large"
            onClick={onStartCamera}
            disabled={loading || !!videoFrame}
            startIcon={<span role="img" aria-label="camera">🎥</span>}
            sx={{
              minWidth: '200px',
              py: 1.5,
              fontSize: '1.1rem',
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
          >
            {videoFrame ? 'Frame Captured' : 'Start Camera & Begin Recording'}
          </Button>
        ) : (
          <>
            {/* Main Capture Button */}
            <Button
              variant="contained"
              size="large"
              onClick={onCaptureFrame}
              disabled={loading}
              color="success"
              startIcon={<span role="img" aria-label="capture">📸</span>}
              sx={{
                minWidth: '200px',
                py: 1.5,
                fontSize: '1.1rem',
                animation: liveSimilarity >= 60 ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' }
                }
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Capture Frame'}
            </Button>

            {/* Progress Indicator */}
            <Box sx={{
              display: 'flex',
              gap: 1,
              mt: 1,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <Typography variant="body2" sx={{ minWidth: '120px' }}>
                Progress: {promptIndex}/{poseSteps.length} poses
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {poseSteps.map((pose, index) => (
                  <Box
                    key={pose}
                    sx={{
                      width: 20,
                      height: 8,
                      backgroundColor: index < promptIndex ? '#4caf50' : index === promptIndex ? '#ff9800' : '#e0e0e0',
                      borderRadius: '4px'
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Pose Capture Section */}
            {promptIndex < poseSteps.length && (
              <Box sx={{
                display: 'flex',
                gap: 2,
                mt: 1,
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <Typography variant="body2">
                  Current: <strong>{poseSteps[promptIndex].toUpperCase()}</strong>
                </Typography>

                <Button
                  variant="outlined"
                  onClick={onCapturePose}
                  disabled={loading || liveSimilarity < 60}
                  sx={{
                    borderColor: liveSimilarity >= 60 ? '#4caf50' : '#ccc',
                    color: liveSimilarity >= 60 ? '#4caf50' : '#999'
                  }}
                >
                  {liveSimilarity >= 60 ? '✅ Capture Pose' : '❌ Position Face'}
                </Button>

                <Typography variant="body2" sx={{
                  color: liveSimilarity >= 60 ? '#4caf50' : liveSimilarity >= 30 ? '#ff9800' : '#f44336'
                }}>
                  Quality: {liveSimilarity ?? '--'}%
                </Typography>
              </Box>
            )}

            {/* Cancel Button */}
            <Button
              variant="outlined"
              onClick={onStopCamera}
              disabled={loading}
              size="small"
              sx={{
                mt: 1,
                color: '#666',
                borderColor: '#ddd',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              Cancel Recording
            </Button>
          </>
        )}

        {/* Frame Captured Actions */}
        {videoFrame && !cameraActive && (
          <Box sx={{
            display: 'flex',
            gap: 2,
            mt: 2,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <Button
              variant="outlined"
              onClick={onRetakeFrame}
              size="large"
              disabled={loading}
              sx={{ minWidth: '120px' }}
            >
              🔄 Retake
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={onVerificationComplete}
              disabled={loading}
              sx={{
                minWidth: '200px',
                backgroundColor: '#4caf50',
                '&:hover': {
                  backgroundColor: '#45a049'
                }
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : '✅ Complete Verification'}
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </VerificationPaper>
  );
};

export default VideoVerificationStep;