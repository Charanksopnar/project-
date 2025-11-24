import React, { useEffect, useRef, useState } from 'react';
import './FaceEnrollment.css';
import * as faceapi from 'face-api.js';

// This component provides camera start/stop, loads face-api.js dynamically (CDN),
// loads models from `/models` (place model files in `public/models`), and runs
// a periodic detection loop. On capture it computes a face descriptor (embedding)
// which can be sent to your backend for storage.

export default function FaceEnrollment({ onSaveEmbedding } = {}) {
  const [cameraOn, setCameraOn] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [statusMsg, setStatusMsg] = useState('idle');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const prevEarRef = useRef(1);
  const blinkDetectedRef = useRef(false);

  // Models will be loaded from `/models` (place model files under public/models)

  async function loadModels() {
    if (!faceapi) {
      setStatusMsg('face-api.js not available');
      return;
    }
    setLoadingModels(true);
    try {
      // Models should be placed in public/models
      const root = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(root);
      await faceapi.nets.faceLandmark68Net.loadFromUri(root);
      await faceapi.nets.faceRecognitionNet.loadFromUri(root);
      setModelLoaded(true);
      setStatusMsg('models loaded');
    } catch (err) {
      console.error('Model load failed', err);
      setStatusMsg('model load failed');
    } finally {
      setLoadingModels(false);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setStatusMsg('camera on');

      // load models (if not already)
      if (!modelLoaded && !loadingModels) await loadModels();

      // start detection loop
      startDetectionLoop();
      // reset challenge state
      setCurrentChallengeIdx(0);
      setChallengeStatus('idle');
    } catch (err) {
      console.error('getUserMedia failed', err);
      setStatusMsg('camera permission denied');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setStatusMsg('camera off');
    stopDetectionLoop();
  }

  function startDetectionLoop() {
    if (!faceapi || !videoRef.current) return;
    stopDetectionLoop();
    detectIntervalRef.current = setInterval(async () => {
      try {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
        const detections = await faceapi.detectAllFaces(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (!detections || !detections.length) {
          setStatusMsg('no face detected');
          return;
        }

        // For enrollment we expect a single face; show status
        if (detections.length > 1) {
          setStatusMsg('multiple faces detected');
        } else {
          setStatusMsg('face detected');
        }

        // If a challenge is active, evaluate it using landmarks
        if (detections.length === 1 && challenges.length) {
          const det = detections[0];
          evaluateChallenge(det);
        }
      } catch (err) {
        console.error('detection error', err);
      }
    }, 1200);
  }

  function stopDetectionLoop() {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
  }

  // Capture current frame, compute descriptor and call onSaveEmbedding if provided
  async function handleCapture() {
    if (!faceapi || !videoRef.current) {
      setStatusMsg('capture unavailable');
      return;
    }
    setStatusMsg('capturing...');
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
    const result = await faceapi.detectSingleFace(videoRef.current, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result) {
      setStatusMsg('no face found; retake');
      return;
    }

    const descriptor = Array.from(result.descriptor || []);
    setStatusMsg('captured');

    // Call callback for saving descriptor; implement server call in parent
    if (typeof onSaveEmbedding === 'function') {
      onSaveEmbedding({ descriptor, landmarks: result.landmarks, detection: result.detection });
    } else {
      // fallback: simply log (developer should replace with API call)
      console.log('descriptor (length):', descriptor.length);
    }
  }

  // --- Challenge-response flow ---
  const challenges = ['blink', 'turnLeft', 'turnRight'];
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [challengeStatus, setChallengeStatus] = useState('idle'); // idle | pending | passed | failed | completed
  const [challengeOrder, setChallengeOrder] = useState(challenges);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const challengeTimerRef = useRef(null);
  const CHALLENGE_TIMEOUT = 8000; // ms per challenge

  function getCurrentChallenge() {
    return challengeOrder[currentChallengeIdx];
  }

  function speak(text) {
    try {
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      // ignore
    }
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startChallengeSequence() {
    // randomize challenge order and start
    const order = shuffleArray(challenges);
    setChallengeOrder(order);
    setCurrentChallengeIdx(0);
    setChallengeStatus('pending');
    setChallengeCompleted(false);
    blinkDetectedRef.current = false;
    prevEarRef.current = 1;
    startChallengeTimer();
    // speak prompt
    const c = order[0];
    speakPromptFor(c);
  }

  function startChallengeTimer() {
    clearChallengeTimer();
    challengeTimerRef.current = setTimeout(() => {
      // timeout -> fail current challenge
      setChallengeStatus('failed');
      speak('Time expired for this challenge. Please retry.');
    }, CHALLENGE_TIMEOUT);
  }

  function clearChallengeTimer() {
    if (challengeTimerRef.current) {
      clearTimeout(challengeTimerRef.current);
      challengeTimerRef.current = null;
    }
  }

  function speakPromptFor(ch) {
    if (ch === 'blink') speak('Please blink now.');
    if (ch === 'turnLeft') speak('Please turn your head to the left.');
    if (ch === 'turnRight') speak('Please turn your head to the right.');
  }

  function eyeAspectRatio(eyePoints) {
    // eyePoints: array of {x,y}
    // compute vertical distances between pairs and horizontal distance
    const p = eyePoints;
    if (!p || p.length < 6) return 1;
    const v1 = Math.hypot(p[1].x - p[5].x, p[1].y - p[5].y);
    const v2 = Math.hypot(p[2].x - p[4].x, p[2].y - p[4].y);
    const h = Math.hypot(p[0].x - p[3].x, p[0].y - p[3].y);
    const ear = (v1 + v2) / (2.0 * h + 1e-6);
    return ear;
  }

  function evaluateChallenge(detection) {
    const challenge = getCurrentChallenge();
    if (!challenge) return;
    const landmarks = detection.landmarks;
    // compute eye openness
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const earLeft = eyeAspectRatio(leftEye);
    const earRight = eyeAspectRatio(rightEye);
    const ear = (earLeft + earRight) / 2;

    // compute nose x relative to box center
    const box = detection.detection.box;
    const centerX = box.x + box.width / 2;
    // use nose tip
    const nose = landmarks.getNose();
    const noseTip = nose[3] || nose[0];

    // Only evaluate when a challenge is pending
    if (challengeStatus !== 'pending') {
      prevEarRef.current = ear;
      return;
    }

    // blink detection: look for close then open
    const EAR_CLOSED = 0.18; // tune this
    async function handlePass() {
      clearChallengeTimer();
      setChallengeStatus('passed');
      speak('Challenge passed');
      // advance to next challenge after a short delay
      setTimeout(() => {
        setCurrentChallengeIdx(i => {
          const next = i + 1;
          if (next >= challengeOrder.length) {
            // completed
            setChallengeStatus('completed');
            setChallengeCompleted(true);
            clearChallengeTimer();
            speak('All challenges completed');
            return i;
          }
          // start next
          setChallengeStatus('pending');
          startChallengeTimer();
          const nextCh = challengeOrder[next];
          speakPromptFor(nextCh);
          return next;
        });
      }, 700);
    }

    if (challenge === 'blink') {
      // detect a blink sequence: open -> closed -> open
      const prev = prevEarRef.current || 1;
      if (!blinkDetectedRef.current) {
        // waiting for closed
        if (ear < EAR_CLOSED && prev >= EAR_CLOSED) {
          blinkDetectedRef.current = true; // closed observed
        }
      } else {
        // waiting for open after closed
        if (ear >= EAR_CLOSED) {
          // blink complete
          blinkDetectedRef.current = false;
          handlePass();
        }
      }
      prevEarRef.current = ear;
    }

    if (challenge === 'turnLeft') {
      const DIFF = centerX - noseTip.x;
      if (DIFF > box.width * 0.12) {
        handlePass();
      }
    }

    if (challenge === 'turnRight') {
      const DIFF = noseTip.x - centerX;
      if (DIFF > box.width * 0.12) {
        handlePass();
      }
    }
  }

  useEffect(() => {
    return () => {
      stopCamera();
      stopDetectionLoop();
      clearChallengeTimer();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="fe-root">
      <header className="fe-header">
        <h2>Face Enrollment</h2>
        <p className="fe-instructions">Good lighting • No mask • Single person • Neutral background</p>
      </header>

      <section className="fe-main">
        <div className="fe-preview">
          <video ref={videoRef} className="fe-video" autoPlay muted playsInline />
        </div>

        <div className="fe-controls">
          <div className="fe-status">Camera: {cameraOn ? 'On' : 'Off'}</div>
          <div className="fe-status">Model: {modelLoaded ? 'loaded' : loadingModels ? 'loading' : 'not loaded'}</div>
          {!cameraOn ? (
            <button className="fe-btn primary" onClick={startCamera}>Start Camera</button>
          ) : (
            <button className="fe-btn" onClick={stopCamera}>Stop Camera</button>
          )}

          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>Liveness Challenge</div>
            <div style={{ color: '#6b7280' }}>
              Current: {currentChallengeIdx >= challenges.length ? 'Completed' : getCurrentChallenge()}
              {' '}- Status: {challengeStatus}
            </div>
            <div style={{ marginTop: 6 }}>
              <button className="fe-btn" onClick={startChallengeSequence}>Start Liveness Challenge</button>
              {challengeStatus === 'failed' && (
                <div style={{ marginTop: 8 }}>
                  <button className="fe-btn" onClick={() => {
                    // retry current challenge
                    setChallengeStatus('pending');
                    blinkDetectedRef.current = false;
                    prevEarRef.current = 1;
                    startChallengeTimer();
                    speakPromptFor(getCurrentChallenge());
                  }}>Retry Challenge</button>
                </div>
              )}
            </div>
            <div className="fe-challenges" style={{ marginTop: 8 }}>
              {challengeOrder.map((c, idx) => {
                let cls = 'upcoming';
                if (idx < currentChallengeIdx) cls = 'passed';
                else if (idx === currentChallengeIdx) cls = challengeStatus;
                return (
                  <div key={idx} className={`fe-challenge ${cls}`}>{c}</div>
                );
              })}
            </div>
          </div>

          <button className="fe-btn secondary" onClick={handleCapture} disabled={!challengeCompleted}>Capture</button>
          <button className="fe-btn alt" onClick={() => setStatusMsg('retake requested')}>Retake</button>

          <div style={{ marginTop: 8, color: '#6b7280' }}>{statusMsg}</div>
        </div>
      </section>

      <footer className="fe-footer">Step 1 of 5 — Front</footer>
    </div>
  );
}
