import { useState, useRef, useCallback, useEffect } from 'react';

export const useCamera = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const enumerateVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vids = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(vids);
      if (!selectedDeviceId && vids.length) {
        setSelectedDeviceId(vids[0].deviceId);
      }
    } catch (e) {
      console.warn('enumerate devices failed', e);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    enumerateVideoDevices();
  }, [enumerateVideoDevices]);

  const cleanupVideoResources = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }

    setCameraActive(false);
  }, []);

  const startCamera = async (retryWithBasicConstraints = false) => {
    try {
      setError(null);
      setIsLoading(true);
      console.log('🔄 Requesting camera access...');

      // Define constraints first
      let constraints;
      if (retryWithBasicConstraints || retryAttempts > 0) {
        constraints = {
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 }
          },
          audio: false
        };
        console.log('📝 Using basic constraints for retry');
      } else {
        constraints = {
          video: {
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
            facingMode: { ideal: 'user' },
            frameRate: { ideal: 30, min: 15 }
          },
          audio: false
        };
      }

      console.log('📋 Camera constraints:', constraints);

      // Add timeout to prevent hanging
      const cameraPromise = navigator.mediaDevices.getUserMedia(constraints);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Camera request timeout')), 10000)
      );

      const stream = await Promise.race([cameraPromise, timeoutPromise]);
      console.log('✅ Camera access granted:', stream);
      console.log('📊 Stream details:', {
        active: stream.active,
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      streamRef.current = stream;

      if (videoRef.current) {
        console.log('Setting up video element with stream:', stream);

        // Clear any existing stream
        if (videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject;
          oldStream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }

        // Ensure video element is visible and ready
        videoRef.current.style.visibility = 'visible';
        videoRef.current.style.opacity = '1';
        videoRef.current.style.display = 'block';
        
        // Set the new stream
        videoRef.current.srcObject = stream;
        
        // Force video to load and play
        videoRef.current.load();

        // Set video properties
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.volume = 0;
        
        // Set video dimensions
        videoRef.current.style.width = '100%';
        videoRef.current.style.height = '100%';
        videoRef.current.style.objectFit = 'cover';

        console.log('Video element properties:', {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState,
          srcObject: !!videoRef.current.srcObject,
          paused: videoRef.current.paused,
          ended: videoRef.current.ended
        });

        // Log stream info if available
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject;
          console.log('Stream info:', {
            active: stream.active,
            tracks: stream.getTracks().length,
            videoTracks: stream.getVideoTracks().length,
            audioTracks: stream.getAudioTracks().length
          });
        }

        // Wait for video to be ready and play
        await new Promise((resolve, reject) => {
          // Check if video is already ready
          if (videoRef.current.readyState >= 2) {
            console.log('Video already ready, playing immediately...');
            videoRef.current.play()
              .then(() => {
                console.log('✅ Video playing successfully');
                resolve();
              })
              .catch((playError) => {
                console.error('❌ Failed to play video:', playError);
                // Don't reject - continue anyway
                resolve();
              });
            return;
          }

          const handleCanPlay = () => {
            console.log('Video can play, attempting to play...');
            if (videoRef.current) {
              videoRef.current.removeEventListener('canplay', handleCanPlay);
              videoRef.current.removeEventListener('loadedmetadata', handleCanPlay);
              videoRef.current.removeEventListener('error', handleError);
            }

            videoRef.current.play()
              .then(() => {
                console.log('✅ Video playing successfully');
                console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                resolve();
              })
              .catch((playError) => {
                console.error('❌ Failed to play video:', playError);
                // Don't reject - video might still work
                console.warn('Continuing despite play error...');
                resolve();
              });
          };

          const handleError = (error) => {
            console.error('❌ Video element error:', error);
            if (videoRef.current) {
              videoRef.current.removeEventListener('canplay', handleCanPlay);
              videoRef.current.removeEventListener('loadedmetadata', handleCanPlay);
              videoRef.current.removeEventListener('error', handleError);
            }
            // Don't reject - continue anyway
            console.warn('Continuing despite video error...');
            resolve();
          };

          videoRef.current.addEventListener('canplay', handleCanPlay);
          videoRef.current.addEventListener('loadedmetadata', handleCanPlay);
          videoRef.current.addEventListener('error', handleError);

          // Try to play immediately
          videoRef.current.play().catch(() => {
            console.log('Initial play failed, waiting for canplay event...');
          });

          // Timeout fallback - resolve after 2 seconds regardless
          setTimeout(() => {
            console.log('Video setup timeout - resolving anyway');
            if (videoRef.current) {
              videoRef.current.removeEventListener('canplay', handleCanPlay);
              videoRef.current.removeEventListener('loadedmetadata', handleCanPlay);
              videoRef.current.removeEventListener('error', handleError);
              // Try one more time to play
              videoRef.current.play().catch(() => {});
            }
            resolve();
          }, 2000);
        });

        console.log('✅ Camera setup completed successfully');
        console.log('📊 Final video element state:', {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState,
          srcObject: !!videoRef.current.srcObject,
          paused: videoRef.current.paused,
          ended: videoRef.current.ended
        });
      } else {
        console.error('❌ Video ref is null');
        throw new Error('Video element not available');
      }

      setCameraActive(true);
      setRetryAttempts(0);
      setIsLoading(false);
      console.log('🎉 Camera is now active and ready!');
    } catch (error) {
      setIsLoading(false);
      console.error('❌ Error accessing camera:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      let errorMessage = 'Failed to access camera. ';

      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'NotSupportedError') {
        if (retryAttempts < 2) {
          console.log('🔄 Retrying with basic constraints...');
          setRetryAttempts(prev => prev + 1);
          setTimeout(() => startCamera(true), 1000);
          return;
        } else {
          errorMessage += 'Camera may not support the requested resolution. Try refreshing the page.';
        }
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Camera access blocked. Please check browser permissions.';
      } else if (error.name === 'AbortError') {
        errorMessage += 'Camera access aborted. Please try again.';
      } else if (error.message === 'Camera request timeout') {
        errorMessage += 'Camera request timed out. Please try again.';
      } else {
        errorMessage += `Please check your camera and try again. Error: ${error.message}`;
      }

      console.error('❌ Final error message:', errorMessage);
      setError(errorMessage);

      // Make sure camera is marked as inactive on error
      setCameraActive(false);
    }
  };

  const stopCamera = useCallback(() => {
    cleanupVideoResources();
  }, [cleanupVideoResources]);

  const captureVideoFrame = useCallback(() => {
    if (!videoRef.current) {
      throw new Error('Video reference not available');
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;

      console.log('Attempting to capture frame. Video state:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        ended: video.ended
      });

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        reject(new Error(`Video not ready. Width: ${video.videoWidth}, Height: ${video.videoHeight}`));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Mirror the image horizontally to match the mirrored video display
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.setTransform(1, 0, 0, 1, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          console.log(`✅ Frame captured successfully: ${blob.size} bytes`);
          const file = new File([blob], 'video-frame.jpg', { type: 'image/jpeg' });
          resolve(file);
        } else {
          console.error('❌ Failed to create blob from canvas');
          reject(new Error('Failed to capture frame'));
        }
      }, 'image/jpeg', 0.95);
    });
  }, []);

  // Debug function to check camera status
  const getCameraStatus = useCallback(() => {
    if (!videoRef.current) {
      return { status: 'no-video-ref' };
    }

    const video = videoRef.current;
    return {
      status: cameraActive ? 'active' : 'inactive',
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      srcObject: !!video.srcObject,
      paused: video.paused,
      ended: video.ended,
      streamTracks: video.srcObject ? video.srcObject.getTracks().length : 0
    };
  }, [cameraActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupVideoResources();
    };
  }, [cleanupVideoResources]);

  return {
    videoRef,
    cameraActive,
    error,
    isLoading,
    videoDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    startCamera,
    stopCamera,
    captureVideoFrame,
    retryAttempts,
    getCameraStatus
  };
};