const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminAuth } = require('../middleware/auth');
const whitelistChecker = require('../biometrics/whitelistChecker');

const WHITELIST_PATH = process.env.WHITELIST_PATH || path.join(__dirname, '..', 'biometrics', 'whitelist');
const PATTERNS_FILE = path.join(__dirname, '..', 'biometrics', 'whitelist_patterns.json');

// ensure directory exists
if (!fs.existsSync(WHITELIST_PATH)) {
  fs.mkdirSync(WHITELIST_PATH, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, WHITELIST_PATH);
  },
  filename: function (req, file, cb) {
    const safeName = `${Date.now()}-${file.originalname}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage });

// Helper to read/write patterns file
function readPatterns() {
  try {
    if (!fs.existsSync(PATTERNS_FILE)) return {};
    const raw = fs.readFileSync(PATTERNS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function writePatterns(obj) {
  try {
    fs.writeFileSync(PATTERNS_FILE, JSON.stringify(obj, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

// GET /admin/whitelist/ - list current whitelist entries
router.get('/', adminAuth, async (req, res) => {
  try {
    const list = whitelistChecker.getWhitelist() || [];
    const simplified = list.map(i => ({ file: i.file, filename: path.basename(i.file), hash: i.hash }));
    res.status(200).json({ success: true, whitelist: simplified });
  } catch (e) {
    console.error('Error listing whitelist:', e);
    res.status(500).json({ success: false, message: 'Server error listing whitelist' });
  }
});

// POST /admin/whitelist/upload - upload a new template image
// multipart/form-data: file field 'template', optional body: idType, patterns (comma-separated)
router.post('/upload', adminAuth, upload.single('template'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Optionally add patterns for an idType
    const { idType, patterns } = req.body || {};
    if (idType && patterns) {
      const p = Array.isArray(patterns) ? patterns : String(patterns).split(',').map(s => s.trim()).filter(Boolean);
      const all = readPatterns();
      all[idType] = p;
      writePatterns(all);
    }

    // Reload whitelist hashes
    await whitelistChecker.loadWhitelist(WHITELIST_PATH);

    res.status(201).json({ success: true, file: req.file.filename, path: req.file.path });
  } catch (e) {
    console.error('Error uploading whitelist template:', e);
    res.status(500).json({ success: false, message: 'Server error uploading template' });
  }
});

// DELETE /admin/whitelist/template - body: { filename }
router.delete('/template', adminAuth, async (req, res) => {
  try {
    const { filename } = req.body || {};
    if (!filename) return res.status(400).json({ success: false, message: 'filename required' });
    const full = path.join(WHITELIST_PATH, filename);
    if (!fs.existsSync(full)) return res.status(404).json({ success: false, message: 'File not found' });
    fs.unlinkSync(full);
    await whitelistChecker.loadWhitelist(WHITELIST_PATH);
    res.status(200).json({ success: true, message: 'Template removed' });
  } catch (e) {
    console.error('Error deleting whitelist template:', e);
    res.status(500).json({ success: false, message: 'Server error deleting template' });
  }
});

// GET /admin/whitelist/patterns - list stored patterns
router.get('/patterns', adminAuth, (req, res) => {
  try {
    const all = readPatterns();
    res.status(200).json({ success: true, patterns: all });
  } catch (e) {
    console.error('Error reading patterns:', e);
    res.status(500).json({ success: false, message: 'Server error reading patterns' });
  }
});

// POST /admin/whitelist/patterns - body: { idType, patterns: [] }
router.post('/patterns', adminAuth, (req, res) => {
  try {
    const { idType, patterns } = req.body || {};
    if (!idType || !patterns) return res.status(400).json({ success: false, message: 'idType and patterns required' });
    const p = Array.isArray(patterns) ? patterns : String(patterns).split(',').map(s => s.trim()).filter(Boolean);
    const all = readPatterns();
    all[idType] = p;
    if (!writePatterns(all)) return res.status(500).json({ success: false, message: 'Failed to save patterns' });
    res.status(200).json({ success: true, idType, patterns: p });
  } catch (e) {
    console.error('Error writing patterns:', e);
    res.status(500).json({ success: false, message: 'Server error saving patterns' });
  }
});

module.exports = router;
