import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, CircularProgress } from '@mui/material';

const InlineCameraDiagnostic = ({ open, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState({ running: false, message: 'Idle', success: null });

  useEffect(() => {
    if (open) {
      runDiagnostic();
    } else {
      stopStream();
      setStatus({ running: false, message: 'Idle', success: null });
    }

    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const runDiagnostic = async () => {
    setStatus({ running: true, message: 'Requesting camera access...', success: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      // basic capability info
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings ? track.getSettings() : {};
      setStatus({ running: false, message: `Camera OK — ${settings.width || 'unknown'}x${settings.height || 'unknown'}`, success: true });
    } catch (err) {
      setStatus({ running: false, message: `Camera access failed: ${err.message}`, success: false });
    }
  };

  return (
    <Dialog open={open} onClose={() => { stopStream(); onClose(); }} maxWidth="xs" fullWidth>
      <DialogTitle>Camera Diagnostic</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <video ref={videoRef} style={{ width: '100%', borderRadius: 6, background: '#000' }} muted playsInline />
          <Typography variant="body2" color={status.success === false ? 'error' : 'text.secondary'}>
            {status.running ? 'Running diagnostic...' : status.message}
          </Typography>
          {status.running && <CircularProgress size={20} />}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { stopStream(); runDiagnostic(); }} disabled={status.running}>Retry</Button>
        <Button onClick={() => { stopStream(); onClose(); }} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InlineCameraDiagnostic;
