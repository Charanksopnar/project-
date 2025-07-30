// Browser compatibility utilities for the Online Voting System

/**
 * Check if the browser supports required features for the voting system
 */
export const checkBrowserCompatibility = () => {
  const compatibility = {
    webRTC: false,
    mediaDevices: false,
    canvas: false,
    webGL: false,
    localStorage: false,
    sessionStorage: false,
    webWorkers: false,
    overall: false
  };

  // Check WebRTC support
  compatibility.webRTC = !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.RTCPeerConnection
  );

  // Check MediaDevices API
  compatibility.mediaDevices = !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );

  // Check Canvas support
  compatibility.canvas = !!(
    document.createElement('canvas').getContext &&
    document.createElement('canvas').getContext('2d')
  );

  // Check WebGL support
  try {
    const canvas = document.createElement('canvas');
    compatibility.webGL = !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch (e) {
    compatibility.webGL = false;
  }

  // Check localStorage support
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    compatibility.localStorage = true;
  } catch (e) {
    compatibility.localStorage = false;
  }

  // Check sessionStorage support
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
    compatibility.sessionStorage = true;
  } catch (e) {
    compatibility.sessionStorage = false;
  }

  // Check Web Workers support
  compatibility.webWorkers = typeof Worker !== 'undefined';

  // Overall compatibility check
  compatibility.overall =
    compatibility.webRTC &&
    compatibility.mediaDevices &&
    compatibility.canvas &&
    compatibility.localStorage &&
    compatibility.sessionStorage;

  // Generate warnings and issues
  const issues = [];
  const warnings = [];
  const recommendations = [];

  if (!compatibility.webRTC) {
    issues.push('WebRTC is not supported');
  }
  if (!compatibility.mediaDevices) {
    issues.push('MediaDevices API is not supported');
  }
  if (!compatibility.canvas) {
    issues.push('Canvas is not supported');
  }
  if (!compatibility.localStorage) {
    warnings.push('LocalStorage is not supported');
  }
  if (!compatibility.sessionStorage) {
    warnings.push('SessionStorage is not supported');
  }
  if (!compatibility.webGL) {
    warnings.push('WebGL is not supported');
  }

  // Create report
  const report = {
    compatible: compatibility.overall,
    issues,
    warnings,
    recommendations,
    features: compatibility
  };

  return {
    results: compatibility,
    report: report
  };
};

/**
 * Get browser information
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }

  return {
    name: browserName,
    version: browserVersion,
    userAgent: userAgent,
    platform: navigator.platform,
    language: navigator.language
  };
};

/**
 * Display compatibility warnings to the user
 */
export const displayCompatibilityWarnings = (compatibility) => {
  const warnings = [];

  if (!compatibility.webRTC) {
    warnings.push('WebRTC is not supported. Video verification features may not work.');
  }

  if (!compatibility.mediaDevices) {
    warnings.push('Media devices access is not supported. Camera and microphone features may not work.');
  }

  if (!compatibility.canvas) {
    warnings.push('Canvas is not supported. Some visual features may not work properly.');
  }

  if (!compatibility.localStorage) {
    warnings.push('Local storage is not supported. Some data may not persist between sessions.');
  }

  if (!compatibility.sessionStorage) {
    warnings.push('Session storage is not supported. Some temporary data may not be stored properly.');
  }

  return warnings;
};

/**
 * Check if the current browser is supported for secure voting
 */
export const isSecureVotingSupported = () => {
  const compatibility = checkBrowserCompatibility();
  return compatibility.overall;
};

/**
 * Get user-friendly error message for camera access errors
 */
export const getCameraErrorMessage = (error) => {
  if (!error) {
    return 'Unknown camera error occurred.';
  }

  switch (error.name) {
    case 'NotAllowedError':
      return 'Camera access was denied. Please allow camera access and try again.';

    case 'NotFoundError':
      return 'No camera found on this device. Please connect a camera and try again.';

    case 'NotReadableError':
      return 'Camera is already in use by another application. Please close other applications using the camera and try again.';

    case 'OverconstrainedError':
      return 'Camera does not support the required settings. Trying with basic settings...';

    case 'SecurityError':
      return 'Camera access is blocked due to security restrictions. Please check your browser settings.';

    case 'AbortError':
      return 'Camera access was interrupted. Please try again.';

    case 'TypeError':
      return 'Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.';

    default:
      return `Camera error: ${error.message || 'Unknown error occurred'}. Please check your camera and try again.`;
  }
};

/**
 * Get optimal media constraints based on device capabilities and retry attempts
 */
export const getOptimalMediaConstraints = async (retryAttempts = 0) => {
  // Basic constraints for compatibility mode
  if (retryAttempts > 0) {
    return {
      video: {
        width: { ideal: 320, min: 240 },
        height: { ideal: 240, min: 180 },
        facingMode: 'user'
      },
      audio: false
    };
  }

  // Enhanced constraints for optimal quality
  return {
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
};

// Export as browserCompatibility object
export const browserCompatibility = {
  checkBrowserCompatibility,
  getBrowserInfo,
  displayCompatibilityWarnings,
  isSecureVotingSupported,
  getCameraErrorMessage,
  getOptimalMediaConstraints
};

// Default export
const browserCompatibilityUtils = {
  checkBrowserCompatibility,
  getBrowserInfo,
  displayCompatibilityWarnings,
  isSecureVotingSupported,
  getCameraErrorMessage,
  getOptimalMediaConstraints
};

export default browserCompatibilityUtils;
