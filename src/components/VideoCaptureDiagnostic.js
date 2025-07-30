import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Paper, Alert, List, ListItem, ListItemText } from '@mui/material';
import { browserCompatibility } from '../utils/browserCompatibility';

const VideoCaptureDiagnostic = () => {
  const [diagnosticResults, setDiagnosticResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results = {};

    try {
      // Test 1: Browser Compatibility
      setCurrentTest('Checking browser compatibility...');
      const compatibility = browserCompatibility.checkBrowserCompatibility();
      results.compatibility = compatibility;

      // Test 2: HTTPS Check
      setCurrentTest('Checking HTTPS...');
      results.isHTTPS = window.location.protocol === 'https:';
      results.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      // Test 3: MediaDevices API
      setCurrentTest('Checking MediaDevices API...');
      results.mediaDevicesSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

      // Test 4: Enumerate Devices
      if (results.mediaDevicesSupported) {
        setCurrentTest('Enumerating media devices...');
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          results.devices = devices;
          results.videoDevices = devices.filter(device => device.kind === 'videoinput');
          results.audioDevices = devices.filter(device => device.kind === 'audioinput');
        } catch (error) {
          results.deviceEnumerationError = error.message;
        }
      }

      // Test 5: Basic Camera Access
      if (results.mediaDevicesSupported) {
        setCurrentTest('Testing basic camera access...');
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
          });
          results.basicCameraAccess = true;
          results.basicStreamTracks = basicStream.getTracks().map(track => ({
            kind: track.kind,
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState
          }));
          
          // Set up video element
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            await new Promise((resolve) => {
              videoRef.current.onloadedmetadata = resolve;
            });
            await videoRef.current.play();
            results.videoElementSetup = true;
          }
          
          setStream(basicStream);
        } catch (error) {
          results.basicCameraAccess = false;
          results.basicCameraError = {
            name: error.name,
            message: error.message,
            userFriendlyMessage: browserCompatibility.getCameraErrorMessage(error)
          };
        }
      }

      // Test 6: Advanced Camera Constraints
      if (results.basicCameraAccess) {
        setCurrentTest('Testing advanced camera constraints...');
        try {
          const advancedConstraints = await browserCompatibility.getOptimalMediaConstraints();
          const advancedStream = await navigator.mediaDevices.getUserMedia(advancedConstraints);
          results.advancedCameraAccess = true;
          results.advancedConstraints = advancedConstraints;
          
          // Stop the advanced stream
          advancedStream.getTracks().forEach(track => track.stop());
        } catch (error) {
          results.advancedCameraAccess = false;
          results.advancedCameraError = {
            name: error.name,
            message: error.message,
            userFriendlyMessage: browserCompatibility.getCameraErrorMessage(error)
          };
        }
      }

      // Test 7: Face-API.js Availability
      setCurrentTest('Checking face-api.js availability...');
      results.faceApiAvailable = !!(window.faceapi);
      if (results.faceApiAvailable) {
        results.faceApiVersion = window.faceapi.version || 'unknown';
      }

      setCurrentTest('Diagnostics complete');
      setDiagnosticResults(results);
    } catch (error) {
      results.generalError = error.message;
      setDiagnosticResults(results);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const renderResults = () => {
    if (Object.keys(diagnosticResults).length === 0) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Diagnostic Results
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText
              primary="Browser Compatibility"
              secondary={
                diagnosticResults.compatibility?.overall 
                  ? "✅ Compatible" 
                  : "❌ Not Compatible"
              }
            />
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="HTTPS/Localhost"
              secondary={
                diagnosticResults.isHTTPS || diagnosticResults.isLocalhost
                  ? "✅ Secure context available"
                  : "❌ HTTPS required for camera access"
              }
            />
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="MediaDevices API"
              secondary={
                diagnosticResults.mediaDevicesSupported
                  ? "✅ Supported"
                  : "❌ Not supported"
              }
            />
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="Video Devices"
              secondary={
                diagnosticResults.videoDevices
                  ? `✅ Found ${diagnosticResults.videoDevices.length} video device(s)`
                  : "❌ No video devices found"
              }
            />
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="Basic Camera Access"
              secondary={
                diagnosticResults.basicCameraAccess
                  ? "✅ Camera access granted"
                  : `❌ ${diagnosticResults.basicCameraError?.userFriendlyMessage || 'Camera access failed'}`
              }
            />
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="Face-API.js"
              secondary={
                diagnosticResults.faceApiAvailable
                  ? `✅ Available (version: ${diagnosticResults.faceApiVersion})`
                  : "❌ Not available"
              }
            />
          </ListItem>
        </List>

        {diagnosticResults.basicCameraError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Camera Error Details:</Typography>
            <Typography variant="body2">
              Error Type: {diagnosticResults.basicCameraError.name}
            </Typography>
            <Typography variant="body2">
              Message: {diagnosticResults.basicCameraError.message}
            </Typography>
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Video Capture Diagnostic Tool
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        This tool will help diagnose issues with video capture functionality.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={runDiagnostics}
          disabled={isRunning}
          sx={{ mr: 2 }}
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={stopCamera}
          disabled={!stream}
        >
          Stop Camera
        </Button>
      </Box>

      {currentTest && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {currentTest}
        </Alert>
      )}

      {stream && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Live Video Feed
          </Typography>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              maxWidth: '400px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              transform: 'scaleX(-1)' // Mirror the video horizontally
            }}
          />
        </Box>
      )}

      {renderResults()}
    </Paper>
  );
};

export default VideoCaptureDiagnostic;
