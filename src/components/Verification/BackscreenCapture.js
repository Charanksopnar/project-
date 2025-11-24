import React, { useRef, useEffect, useState } from 'react';
import { analyzeFrame } from '../../utils/videoAnalyzer';
import { createPolicySession } from '../../utils/verificationPolicy';
import WarningToast from './WarningToast';
import BlockModal from './BlockModal';
import { uploadBlockAudit } from '../../utils/auditUploader';

export default function BackscreenCapture({ voterId, electionId, onBlock, onWarn, fps = 6 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const policy = useRef(null);
  const [warningMsg, setWarningMsg] = useState(null);
  const [blockedInfo, setBlockedInfo] = useState(null);

  useEffect(() => {
    policy.current = createPolicySession({ voterId, electionId });
  }, [voterId, electionId]);

  useEffect(() => {
    let mounted = true;
    let raf = null;
    let intervalMs = Math.round(1000 / Math.max(1, fps));

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (!mounted) return;
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.style.display = 'none';
        video.srcObject = stream;
        document.body.appendChild(video);
        videoRef.current = video;

        await video.play();

        const canvas = document.createElement('canvas');
        canvasRef.current = canvas;

        let lastTime = performance.now();

        const loop = async () => {
          if (!mounted || !video || policy.current?.getState().blocked) return;
          const now = performance.now();
          if (now - lastTime >= intervalMs) {
            lastTime = now;
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            try {
              const result = await analyzeFrame(frame);
              const action = policy.current.handleDetection(result);
              if (action && action.action === 'warn') {
                const msg = action.message || 'Multiple people detected. Please ensure you are alone.';
                setWarningMsg(msg);
                onWarn && onWarn({ voterId, electionId, warningsCount: action.warningsCount, message: msg });
              } else if (action && action.action === 'block') {
                const info = { voterId, electionId, reason: action.reason || 'multiple_persons_3rd_warning', auditRef: action.auditRef };
                setBlockedInfo(info);
                onBlock && onBlock(info);
                // record short snippet and upload
                try {
                  const blob = await recordSnippetFromStream(video.srcObject, 2000);
                  const resp = await uploadBlockAudit({ voterId, electionId, reason: info.reason, auditRef: info.auditRef, blob, meta: { note: 'auto-recorded snippet' } });
                  info.auditSaved = resp;
                  setBlockedInfo({ ...info, auditSaved: resp });
                } catch (e) {
                  console.error('Failed to record/upload audit snippet', e);
                }
              } else {
                setWarningMsg(null);
              }
            } catch (err) {
              // ignore analyzer errors
            }
          }
          raf = window.requestAnimationFrame(loop);
        };

        raf = window.requestAnimationFrame(loop);
      } catch (err) {
        // permission denied or camera not available
      }
    }

    start();

    return () => {
      mounted = false;
      if (raf) window.cancelAnimationFrame(raf);
      if (videoRef.current) {
        try {
          const tracks = videoRef.current.srcObject && videoRef.current.srcObject.getTracks();
          tracks && tracks.forEach(t => t.stop());
        } catch (e) {}
        try { videoRef.current.remove(); } catch (e) {}
      }
      if (canvasRef.current) try { canvasRef.current.remove(); } catch (e) {}
    };
  }, [fps, onWarn, onBlock, voterId, electionId]);

  return (
    <>
      {warningMsg && <WarningToast message={warningMsg} />}
      {blockedInfo && <BlockModal info={blockedInfo} />}
    </>
  );
}

function recordSnippetFromStream(stream, durationMs = 2000) {
  return new Promise((resolve, reject) => {
    if (!stream) return reject(new Error('No stream available'));
    let options = { mimeType: 'video/webm;codecs=vp8' };
    let recorded = [];
    try {
      const mr = new MediaRecorder(stream, options);
      mr.ondataavailable = (ev) => { if (ev.data && ev.data.size) recorded.push(ev.data); };
      mr.onstop = () => {
        const blob = new Blob(recorded, { type: 'video/webm' });
        resolve(blob);
      };
      mr.onerror = (e) => reject(e.error || new Error('MediaRecorder error'));
      mr.start();
      setTimeout(() => {
        try { mr.stop(); } catch (e) { /* ignore */ }
      }, durationMs);
    } catch (err) {
      reject(err);
    }
  });
}
