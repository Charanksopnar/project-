import React, { useState, useRef } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';

const CameraTest = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('🎥 Starting camera test...');

      const constraints = {
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: { ideal: 'user' }
        },
        audio: false
      };

      console.log('📋 Requesting camera with constraints:', constraints);

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera access granted:', mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;

        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded');
          console.log('📊 Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          setCameraActive(true);
          setStream(mediaStream);
        };

        videoRef.current.onerror = (e) => {
          console.error('❌ Video element error:', e);
          setError('Video element error: ' + e.message);
        };
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      setError(`Camera error: ${err.name} - ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const checkPermissions = async () => {
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' });
      console.log('🔐 Camera permission status:', permissions.state);
      alert(`Camera permission: ${permissions.state}`);
    } catch (err) {
      console.error('❌ Permission check error:', err);
      alert('Permission check error: ' + err.message);
    }
  };

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      console.log('📷 Video devices found:', videoDevices.length);
      console.log('📋 Device details:', videoDevices);
      alert(`Found ${videoDevices.length} camera(s):\n${videoDevices.map(d => `${d.label || 'Unknown'} (${d.deviceId})`).join('\n')}`);
    } catch (err) {
      console.error('❌ Device enumeration error:', err);
      alert('Device enumeration error: ' + err.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📷 Camera Test Page
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Camera Diagnostics
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={startCamera}>
            🎥 Start Camera
          </Button>
          <Button variant="outlined" onClick={stopCamera} disabled={!cameraActive}>
            🛑 Stop Camera
          </Button>
          <Button variant="outlined" onClick={checkPermissions}>
            🔐 Check Permissions
          </Button>
          <Button variant="outlined" onClick={enumerateDevices}>
            📋 List Devices
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Typography variant="body2">
            <strong>Camera Status:</strong> {cameraActive ? '✅ Active' : '❌ Inactive'}
          </Typography>
          <Typography variant="body2">
            <strong>Stream:</strong> {stream ? '✅ Active' : '❌ Inactive'}
          </Typography>
        </Box>

        <details style={{ marginTop: '16px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            🔍 Debug Information
          </summary>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" component="pre" sx={{ fontSize: '12px', overflow: 'auto' }}>
              {`
Browser: ${navigator.userAgent}
User Agent: ${navigator.userAgent}
Platform: ${navigator.platform}
Cookie Enabled: ${navigator.cookieEnabled}
On Line: ${navigator.onLine}
Media Devices: ${navigator.mediaDevices ? '✅ Supported' : '❌ Not Supported'}
getUserMedia: ${navigator.mediaDevices?.getUserMedia ? '✅ Supported' : '❌ Not Supported'}
              `}
            </Typography>
          </Box>
        </details>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Camera Preview
        </Typography>

        <Box
          sx={{
            width: '100%',
            height: 480,
            bgcolor: 'black',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)' // Mirror the video
              }}
            />
          ) : (
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <Typography variant="h6" gutterBottom>
                📹 Camera Preview
              </Typography>
              <Typography variant="body2">
                Click "Start Camera" to see the video feed
              </Typography>
            </Box>
          )}
        </Box>

        {cameraActive && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="success.main">
              ✅ Camera is working! You should see your mirrored face above.
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Troubleshooting Guide
        </Typography>

        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="subtitle2" gutterBottom>
            If camera doesn't work:
          </Typography>

          <Typography variant="body2" component="ol" sx={{ pl: 2 }}>
            <li>Allow camera permissions when prompted by browser</li>
            <li>Try refreshing the page</li>
            <li>Check if another application is using the camera</li>
            <li>Try a different browser (Chrome recommended)</li>
            <li>Check if camera is physically connected</li>
          </Typography>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Common Error Messages:
          </Typography>

          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li><strong>NotAllowedError:</strong> Camera permission denied</li>
            <li><strong>NotFoundError:</strong> No camera detected</li>
            <li><strong>NotSupportedError:</strong> Camera not supported</li>
            <li><strong>AbortError:</strong> Camera request was aborted</li>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default CameraTest;