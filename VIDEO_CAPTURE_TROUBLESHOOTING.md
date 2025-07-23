# Video Capture Troubleshooting Guide

This guide helps resolve common issues with video capture functionality in the Online Voting System.

## Quick Diagnostic

Visit `/diagnostic` in your browser to run automated diagnostics that will identify most common issues.

## Common Issues and Solutions

### 1. "Camera access was denied" Error

**Cause**: Browser blocked camera access or user denied permission.

**Solutions**:
- Click the camera icon in the browser address bar and allow camera access
- Check browser settings: Settings > Privacy and Security > Site Settings > Camera
- Ensure the site is allowed to use the camera
- Try refreshing the page and allowing access when prompted

### 2. "No camera found on this device" Error

**Cause**: No camera device detected by the browser.

**Solutions**:
- Ensure a camera is connected to your device
- Check if the camera is working in other applications
- Try unplugging and reconnecting external cameras
- Restart your browser
- Check device manager (Windows) or system preferences (Mac) for camera status

### 3. "Camera is already in use" Error

**Cause**: Another application is using the camera.

**Solutions**:
- Close other applications that might be using the camera (Zoom, Skype, etc.)
- Close other browser tabs that might be accessing the camera
- Restart your browser
- Restart your computer if the issue persists

### 4. "Camera access is blocked due to security restrictions" Error

**Cause**: Browser security settings or HTTPS requirement.

**Solutions**:
- **Use HTTPS**: Modern browsers require HTTPS for camera access
  - For development: Run `npm run start:https` instead of `npm start`
  - For production: Ensure your site is served over HTTPS
- **Localhost Exception**: Camera access works on localhost even without HTTPS
- Check if your browser has strict security settings that block camera access

### 5. "Camera does not support the required settings" Error

**Cause**: Camera doesn't support the requested video constraints.

**Solutions**:
- The system will automatically retry with basic settings
- If it still fails, your camera may be too old or have limited capabilities
- Try using a different camera if available
- Update your camera drivers

### 6. Black screen or no video display

**Cause**: Video element setup issues or browser compatibility.

**Solutions**:
- Refresh the page
- Try a different browser (Chrome, Firefox, Safari, Edge)
- Clear browser cache and cookies
- Disable browser extensions that might interfere
- Check if hardware acceleration is enabled in browser settings

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 53+
- ✅ Firefox 36+
- ✅ Safari 11+
- ✅ Edge 12+

### Unsupported Browsers
- ❌ Internet Explorer (any version)
- ❌ Very old browser versions

## HTTPS Requirements

Modern browsers require HTTPS for camera access due to security reasons.

### Development Setup
```bash
# Start with HTTPS (recommended for testing camera features)
npm run start:https

# Regular start (camera may not work)
npm start
```

### Production Setup
Ensure your production server serves the application over HTTPS.

## System Requirements

### Minimum Requirements
- Camera: Any USB or built-in camera
- Browser: Modern browser with WebRTC support
- Connection: HTTPS or localhost
- Permissions: Camera access allowed

### Recommended Setup
- Camera: HD webcam (720p or higher)
- Browser: Latest version of Chrome or Firefox
- Connection: HTTPS with valid SSL certificate
- Environment: Good lighting for face detection

## Face Detection Issues

### Models Not Loading
- Ensure `/public/models/` directory contains face-api.js model files
- Check browser console for model loading errors
- Verify network connection for model downloads

### Poor Face Detection
- Ensure good lighting
- Position face clearly in camera view
- Avoid multiple people in frame
- Keep face steady and looking at camera

## Advanced Troubleshooting

### Browser Console Debugging
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for error messages related to:
   - `getUserMedia`
   - `face-api.js`
   - Camera permissions
   - Model loading

### Network Issues
- Check if your network blocks WebRTC traffic
- Corporate firewalls may block camera access
- Try from a different network if possible

### Hardware Issues
- Test camera in other applications
- Update camera drivers
- Check USB connections for external cameras
- Try different USB ports

## Getting Help

If you're still experiencing issues:

1. Run the diagnostic tool at `/diagnostic`
2. Check the browser console for error messages
3. Note your browser version and operating system
4. Try the solutions in this guide
5. Contact support with diagnostic results

## Development Notes

### Testing Camera Features
```bash
# Start with HTTPS for full camera functionality
npm run start:https

# Access diagnostic tool
https://localhost:3000/diagnostic
```

### Common Development Issues
- Camera access requires HTTPS in production
- Localhost works without HTTPS for development
- Face-api.js models must be served from `/public/models/`
- Browser permissions persist across sessions

### Code Debugging
Key files for video capture functionality:
- `src/utils/browserCompatibility.js` - Browser compatibility and error handling
- `src/utils/faceDetectionUtils.js` - Face detection utilities
- `src/components/User/Components/Voter/VerifyVoter.js` - Voter verification with camera
- `src/components/User/Components/Voter/SecureVotingSession.js` - Secure voting with monitoring
