import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

// Define the sequence of poses the user needs to perform
const POSE_SEQUENCE = [
  { pose: 'neutral', instruction: 'Look straight at the camera.' },
  { pose: 'happy', instruction: 'Smile for the camera.' },
  { pose: 'surprised', instruction: 'Look surprised.' },
];

export const useFaceDetection = (videoRef, isCameraActive) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [liveSimilarity, setLiveSimilarity] = useState(0);
  const overlayRef = useRef();

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  // Perform face detection when camera is active
  useEffect(() => {
    if (!isCameraActive || !modelsLoaded || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = overlayRef.current;
    const context = canvas.getContext('2d');

    const interval = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length > 0) {
        // Draw face detections
        faceapi.draw.drawDetections(canvas, detections);
        faceapi.draw.drawFaceLandmarks(canvas, detections);
        faceapi.draw.drawFaceExpressions(canvas, detections);

        // Check for current pose
        const currentPose = POSE_SEQUENCE[promptIndex].pose;
        const expression = detections[0].expressions[currentPose];
        if (expression > 0.7) {
          setPoseDetected(true);
          setLiveSimilarity(expression * 100);
        } else {
          setPoseDetected(false);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCameraActive, modelsLoaded, videoRef, promptIndex]);

  // Function to capture the current pose
  const captureCurrentPose = () => {
    if (poseDetected) {
      setCapturing(true);
      setTimeout(() => {
        if (promptIndex < POSE_SEQUENCE.length - 1) {
          setPromptIndex(promptIndex + 1);
          setCapturing(false);
          setPoseDetected(false);
        }
      }, 1000);
    }
  };

  return {
    overlayRef,
    poseSteps: POSE_SEQUENCE,
    promptIndex,
    liveSimilarity,
    captureCurrentPose,
    capturing,
    poseDetected,
  };
};
