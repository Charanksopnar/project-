const express = require('express');
const path = require('path');
const router = express.Router();

const { runPython } = require('../biometrics/pythonRunner');
const liveness = require('../biometrics/livenessDetection');

/**
 * POST /biometrics/verify
 * Body: { id: string, camera?: number, out?: string }
 * Runs the Python multi-angle verifier and returns JSON output.
 */
router.post('/verify', async (req, res) => {
  const { id, camera, out } = req.body || {};

  if (!id) {
    return res.status(400).json({ success: false, message: 'Missing id in request body' });
  }

  const scriptPath = path.resolve(__dirname, '..', 'biometrics', 'multi_angle_capture.py');

  const args = ['--mode', 'verify', '--id', String(id), '--json'];
  if (typeof camera !== 'undefined') {
    args.push('--camera', String(camera));
  }
  if (typeof out !== 'undefined') {
    args.push('--out', String(out));
  }

  try {
    // Increase timeout for user interaction during capture
    const timeout = 3 * 60 * 1000; // 3 minutes
    const result = await runPython(scriptPath, args, { timeout });

    // Prefer stdout JSON; fall back to stderr if parsing fails
    let parsed = null;
    if (result && result.stdout) {
      try {
        parsed = JSON.parse(result.stdout);
      } catch (e) {
        // stdout not JSON; try to extract JSON-like content
        parsed = null;
      }
    }

    if (!parsed) {
      // If Python didn't return JSON, return raw outputs for debugging
      return res.status(200).json({
        success: false,
        message: 'Python script did not return JSON. See output fields for details.',
        python: {
          code: result.code,
          stdout: result.stdout,
          stderr: result.stderr,
          killed: result.killed
        }
      });
    }

    return res.status(200).json({ success: true, result: parsed });
  } catch (err) {
    console.error('Error running python verifier:', err);
    return res.status(500).json({ success: false, message: 'Server error running verifier', error: String(err) });
  }
});

/**
 * POST /biometrics/liveness/report
 * Body: { voterId: string, candidateId: string, personCount: number, recordingId?: string }
 * Accepts lightweight detection reports from the client (frame-based or periodic)
 * and uses server logic to track warnings and invalidate votes if policy violated.
 */
router.post('/liveness/report', async (req, res) => {
  const { voterId, candidateId, personCount, recordingId } = req.body || {};

  if (!voterId || typeof personCount === 'undefined' || !candidateId) {
    return res.status(400).json({ success: false, message: 'Missing required fields: voterId, candidateId, personCount' });
  }

  try {
    const result = await liveness.processDetectionReport(String(voterId), String(candidateId), Number(personCount), recordingId);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('Error processing liveness report:', err);
    return res.status(500).json({ success: false, message: 'Server error processing liveness report', error: String(err) });
  }
});

module.exports = router;

