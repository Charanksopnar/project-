import React, { useEffect, useRef, useState } from 'react';
import './VotingMonitor.css';
import * as faceapi from 'face-api.js';

// VotingMonitor: starts camera, loads face-api.js models and performs periodic
// checks: face count, face match against stored profile, and liveness heuristics.
// Provide `fetchProfile` prop to obtain stored embeddings (array of descriptors)
// and `onBlock` callback to handle blocking.

export default function VotingMonitor({ fetchProfile, onBlock } = {}) {
  const [sessionActive, setSessionActive] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [faceMatchScore, setFaceMatchScore] = useState(null);
  const [facesInFrame, setFacesInFrame] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectRef = useRef(null);
  const storedDescriptorsRef = useRef([]); // array of Float32Array descriptors

  useEffect(() => { loadModels(); }, []);

  async function loadModels() {
    if (!faceapi) return;
    try {
      const root = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(root);
      await faceapi.nets.faceLandmark68Net.loadFromUri(root);
      await faceapi.nets.faceRecognitionNet.loadFromUri(root);
      setModelLoaded(true);
      // fetch stored profile descriptors if fetchProfile is provided
      if (typeof fetchProfile === 'function') {
        try {
          const profile = await fetchProfile();
          // expect profile.embeddings = [[...], ...]
          if (profile && Array.isArray(profile.embeddings)) {
            storedDescriptorsRef.current = profile.embeddings.map(arr => new Float32Array(arr));
          }
        } catch (err) {
          console.warn('fetchProfile failed', err);
        }
      }
    } catch (err) {
      console.error('model load failed', err);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      startDetection();
    } catch (err) {
      console.error('getUserMedia failed', err);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    stopDetection();
  }

  function startDetection() {
    stopDetection();
    detectRef.current = setInterval(async () => {
      if (!faceapi || !videoRef.current) return;
      try {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
        const results = await faceapi.detectAllFaces(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (!results) return;
        setFacesInFrame(results.length);

        if (results.length !== 1) {
          incrementViolation('MULTI_PERSON');
          return;
        }

        const descriptor = results[0].descriptor;
        // simple matching: compare to stored descriptors using euclidean distance
        let best = { dist: Infinity };
        for (const stored of storedDescriptorsRef.current) {
          let sum = 0.0;
          for (let i = 0; i < descriptor.length; i++) {
            const d = descriptor[i] - (stored[i] || 0);
            sum += d * d;
          }
          const dist = Math.sqrt(sum);
          if (dist < best.dist) best = { dist };
        }

        const threshold = 0.6; // example threshold; tune per model
        const similarity = best.dist === Infinity ? 0 : 1 - Math.min(1, best.dist / 1.2);
        setFaceMatchScore(similarity.toFixed(2));
        if (best.dist > threshold) {
          incrementViolation('FACE_MISMATCH');
        }
      } catch (err) {
        console.error('detection error', err);
      }
    }, 1500);
  }

  function stopDetection() {
    if (detectRef.current) {
      clearInterval(detectRef.current);
      detectRef.current = null;
    }
  }

  function incrementViolation(reason) {
    setViolationCount(c => {
      const next = c + 1;
      // handle block at 3
      if (next >= 3) {
        setSessionActive(false);
        stopCamera();
        if (typeof onBlock === 'function') onBlock({ reason, violationCount: next });
      }
      return next;
    });
  }

  useEffect(() => {
    // auto-start camera when component mounts (optional)
    startCamera();
    return () => {
      stopCamera();
      stopDetection();
    };
  }, [modelLoaded]);

  return (
    <div className="vm-root">
      <header className="vm-header">
        <h2>Voting — Live Monitoring</h2>
        <p className="vm-sub">Camera & Mic required — live liveness monitoring active</p>
      </header>

      <div className="vm-grid">
        <div className="vm-video">
          <video ref={videoRef} className="vm-svg" autoPlay muted playsInline />
        </div>

        <aside className="vm-side">
          <div className="vm-status">
            <div>Face Match: <strong>{faceMatchScore ?? '-'}</strong></div>
            <div>Liveness: <strong>heuristic</strong></div>
            <div>Faces in frame: <strong>{facesInFrame}</strong></div>
          </div>

          <div className="vm-warning">
            <div className="vm-warning-title">Warning</div>
            <div>Rule violation detected</div>
            <div>Remaining warnings: {Math.max(0, 3 - violationCount)}</div>
          </div>

          <div className="vm-actions">
            <button className="vm-btn primary" disabled={!sessionActive}>Submit Vote</button>
            <button className="vm-btn" onClick={() => incrementViolation('SIMULATED')}>Simulate Violation</button>
          </div>
        </aside>
      </div>

      <footer className="vm-footer">Violation count: {violationCount}</footer>
    </div>
  );
}
