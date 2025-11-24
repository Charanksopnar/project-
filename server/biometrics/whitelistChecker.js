const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configurable hamming distance threshold via env var
const DEFAULT_THRESHOLD = process.env.WHITELIST_HAMMING_THRESHOLD ? parseInt(process.env.WHITELIST_HAMMING_THRESHOLD, 10) : 10;

// Simple average-hash (aHash) implementation using sharp
async function imageAHash(buffer) {
  // resize to 8x8 and grayscale
  const raw = await sharp(buffer)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  // compute mean
  let sum = 0;
  for (let i = 0; i < raw.length; i++) sum += raw[i];
  const mean = sum / raw.length;

  // build 64-bit hash as hex string
  let bits = '';
  for (let i = 0; i < raw.length; i++) {
    bits += raw[i] >= mean ? '1' : '0';
  }

  // convert bits to hex
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    const nibble = bits.slice(i, i + 4);
    hex += parseInt(nibble, 2).toString(16);
  }

  return hex;
}

function hammingDistanceHex(hex1, hex2) {
  // convert to binary strings with padding
  const b1 = hexToBits(hex1);
  const b2 = hexToBits(hex2);
  let dist = 0;
  for (let i = 0; i < b1.length && i < b2.length; i++) if (b1[i] !== b2[i]) dist++;
  return dist;
}

function hexToBits(hex) {
  let bits = '';
  for (let i = 0; i < hex.length; i++) {
    bits += parseInt(hex[i], 16).toString(2).padStart(4, '0');
  }
  return bits;
}

const state = {
  whitelist: [] // { file, hash }
};

// Helper to test filename against allowed patterns (strings or regex strings)
function matchesAllowedPatterns(filename, allowedPatterns) {
  if (!allowedPatterns || allowedPatterns.length === 0) return true; // no restriction
  for (const p of allowedPatterns) {
    try {
      // If pattern looks like a regex (starts and ends with /), use it as regex
      if (typeof p === 'string' && p.startsWith('/') && p.lastIndexOf('/') > 0) {
        const last = p.lastIndexOf('/');
        const body = p.slice(1, last);
        const flags = p.slice(last + 1);
        const re = new RegExp(body, flags);
        if (re.test(filename)) return true;
      } else {
        // simple substring match (case-insensitive)
        if (String(filename).toLowerCase().includes(String(p).toLowerCase())) return true;
      }
    } catch (e) {
      // ignore pattern errors and continue
      continue;
    }
  }
  return false;
}

async function loadWhitelist(dirPath) {
  try {
    const resolved = path.resolve(dirPath);
    if (!fs.existsSync(resolved)) return { success: false, error: 'Whitelist directory not found', dir: resolved };

    const files = fs.readdirSync(resolved).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext);
    });

    const list = [];
    for (const f of files) {
      try {
        const full = path.join(resolved, f);
        const buf = fs.readFileSync(full);
        const hash = await imageAHash(buf);
        list.push({ file: full, hash });
      } catch (e) {
        // skip problematic files
        console.warn('whitelistChecker: skipping file', f, e.message || e);
      }
    }

    state.whitelist = list;
    return { success: true, count: list.length };
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
}

async function isImageAllowed(buffer, options = {}) {
  const threshold = typeof options.threshold === 'number' ? options.threshold : DEFAULT_THRESHOLD; // hamming distance threshold
  if (!state.whitelist || state.whitelist.length === 0) return { allowed: false, reason: 'WHITELIST_EMPTY' };

  try {
    const hash = await imageAHash(buffer);
    let best = { dist: Infinity, file: null };
    for (const item of state.whitelist) {
      const d = hammingDistanceHex(hash, item.hash);
      if (d < best.dist) best = { dist: d, file: item.file };
    }

    // If caller provided allowedPatterns, ensure the best match file name matches one
    const allowedPatterns = Array.isArray(options.allowedPatterns) ? options.allowedPatterns : (typeof options.allowedPatterns === 'string' && options.allowedPatterns.length ? options.allowedPatterns.split(',') : null);

    const filename = best.file ? path.basename(best.file) : null;
    // If allowedPatterns supplied and best match doesn't satisfy them -> reject
    if (allowedPatterns && allowedPatterns.length > 0 && filename && !matchesAllowedPatterns(filename, allowedPatterns)) {
      return { allowed: false, bestMatch: best.file, distance: best.dist, threshold, reason: 'NO_ALLOWED_PATTERN_MATCH', allowedPatterns };
    }

    const allowed = best.dist <= threshold;
    return { allowed, bestMatch: best.file, distance: best.dist, threshold };
  } catch (error) {
    return { allowed: false, error: error.message || String(error) };
  }
}

module.exports = {
  loadWhitelist,
  isImageAllowed,
  getWhitelist: () => state.whitelist,
  _internal: { imageAHash, hammingDistanceHex }
};
