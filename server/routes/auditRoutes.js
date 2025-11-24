const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

const auditsDir = path.join(__dirname, '..', 'uploads', 'audits');
const dataDir = path.join(__dirname, '..', 'utils', 'data');
const dataFile = path.join(dataDir, 'auditLogs.json');

// Ensure directories exist
try { fs.mkdirSync(auditsDir, { recursive: true }); } catch (e) {}
try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}

// Multer storage to audits directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, auditsDir);
  },
  filename: function (req, file, cb) {
    const name = `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, name);
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// Accepts multipart form: fields: voterId, electionId, reason, meta (json), file field 'video'
router.post('/block', upload.single('video'), (req, res) => {
  try {
    const body = req.body || {};
    const file = req.file;
    const record = {
      id: body.auditRef || `audit_${Date.now()}`,
      voterId: body.voterId || null,
      electionId: body.electionId || null,
      reason: body.reason || 'blocked_by_policy',
      timestamp: new Date().toISOString(),
      videoRef: file ? `/uploads/audits/${file.filename}` : (body.videoRef || null),
      meta: body.meta ? (() => { try { return JSON.parse(body.meta); } catch (e) { return { raw: body.meta }; } })() : {}
    };

    // append to json file
    let existing = [];
    if (fs.existsSync(dataFile)) {
      try {
        const raw = fs.readFileSync(dataFile, 'utf8');
        existing = raw ? JSON.parse(raw) : [];
      } catch (e) {
        existing = [];
      }
    }
    existing.push(record);
    fs.writeFileSync(dataFile, JSON.stringify(existing, null, 2));

    return res.status(201).json({ saved: true, id: record.id, videoRef: record.videoRef });
  } catch (err) {
    console.error('Failed to persist audit record', err);
    return res.status(500).json({ error: 'failed_to_save', detail: String(err) });
  }
});

// Admin-protected download of an audit file by filename
router.get('/download/:filename', adminAuth, (req, res) => {
  try {
    const filename = req.params.filename;
    // Prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'invalid_filename' });
    }
    const filePath = path.join(auditsDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not_found' });
    return res.sendFile(filePath);
  } catch (err) {
    console.error('Failed to serve audit file', err);
    return res.status(500).json({ error: 'failed' });
  }
});

// Admin-protected list of audit records
router.get('/list', adminAuth, (req, res) => {
  try {
    const mockDb = require('../mockDb');
    
    // First try to get from file
    let existing = [];
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf8');
      existing = raw ? JSON.parse(raw) : [];
    }
    
    // If no records in file, return from mockDb
    if (existing.length === 0 && mockDb.auditRecords) {
      existing = mockDb.auditRecords;
    }
    
    return res.status(200).json({ success: true, audits: existing });
  } catch (err) {
    console.error('Failed to read audit logs', err);
    return res.status(500).json({ success: false, error: 'failed_to_read' });
  }
});

module.exports = router;

