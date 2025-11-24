/**
 * build_id_dataset.js
 *
 * Scans a directory of ID images, runs OCR, extracts likely ID numbers
 * (Aadhaar, Voter ID, PAN) and outputs a CSV + JSON file for review.
 *
 * Usage (PowerShell):
 * $env:WHITELIST_PATH='C:\Users\Ravi M\OneDrive\Pictures\voting images'; node build_id_dataset.js
 * or: node build_id_dataset.js "C:\path\to\images"
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const tesseract = require('node-tesseract-ocr');

const INPUT_DIR = process.argv[2] || process.env.WHITELIST_PATH || 'C:\\Users\\Ravi M\\OneDrive\\Pictures\\voting images';
const OUT_DIR = path.join(__dirname, '../uploads/dataset_output');
const TEMP_DIR = path.join(OUT_DIR, 'temp');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const OCR_CONFIG = {
  lang: 'eng+hin',
  oem: 1,
  psm: 6,
  dpi: 300
};

const imageExt = ['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.bmp'];

function sanitizeText(s) {
  return (s || '').replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function preprocessBuffer(buf) {
  // Resize to reasonable width, grayscale and normalize
  try {
    return await sharp(buf)
      .resize(1800, null, { withoutEnlargement: true })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
  } catch (e) {
    return buf;
  }
}

function findIdCandidates(text) {
  // Aadhaar: 12 digits (grouped sometimes 4-4-4)
  const aadhaar = text.match(/\b(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g);
  // Voter ID typical pattern used earlier: 3 letters + 7 digits
  const voter = text.match(/\b([A-Z]{3}[0-9]{7})\b/g);
  // PAN pattern
  const pan = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/g);

  return {
    aadhaar: aadhaar ? aadhaar.map(s => s.replace(/\s|-/g, '')) : [],
    voter: voter || [],
    pan: pan || []
  };
}

async function ocrImage(filePath) {
  const buf = fs.readFileSync(filePath);
  const pre = await preprocessBuffer(buf);
  const tmpName = path.join(TEMP_DIR, `tmp_${Date.now()}_${path.basename(filePath)}`);
  fs.writeFileSync(tmpName, pre);

  try {
    const text = await tesseract.recognize(tmpName, {
      ...OCR_CONFIG,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -/'
    });
    return sanitizeText(text);
  } catch (e) {
    return { error: String(e) };
  } finally {
    try { fs.unlinkSync(tmpName); } catch (e) { }
  }
}

async function buildDataset() {
  const resolved = path.resolve(INPUT_DIR);
  if (!fs.existsSync(resolved)) {
    console.error('Input directory does not exist:', resolved);
    process.exit(1);
  }

  const files = fs.readdirSync(resolved).filter(f => imageExt.includes(path.extname(f).toLowerCase()));
  console.log(`Found ${files.length} image(s) in ${resolved}`);

  const results = [];

  for (const f of files) {
    const full = path.join(resolved, f);
    process.stdout.write(`Processing ${f} ... `);
    try {
      const text = await ocrImage(full);
      if (text && text.error) {
        console.log('OCR error');
        results.push({ file: full, error: text.error });
        continue;
      }

      const candidates = findIdCandidates(text);
      const detectedType = candidates.voter.length ? 'voter' : (candidates.aadhaar.length ? 'aadhaar' : (candidates.pan.length ? 'pan' : 'unknown'));
      const idNumber = candidates.voter[0] || candidates.aadhaar[0] || candidates.pan[0] || '';

      console.log(`done (type=${detectedType}, id=${idNumber || 'none'})`);

      results.push({ file: full, extractedText: text, detectedType, idNumber, rawMatches: candidates });
    } catch (e) {
      console.log('error');
      results.push({ file: full, error: String(e) });
    }
  }

  // Save outputs
  const csvPath = path.join(OUT_DIR, `id_dataset_${Date.now()}.csv`);
  const jsonPath = path.join(OUT_DIR, `id_dataset_${Date.now()}.json`);

  // CSV header
  const header = 'file,detectedType,idNumber,extractedText\n';
  const rows = results.map(r => {
    const esc = (s) => '"' + String(s || '').replace(/"/g, '""') + '"';
    return [esc(r.file), esc(r.detectedType || ''), esc(r.idNumber || ''), esc(r.extractedText || r.error || '')].join(',');
  });

  fs.writeFileSync(csvPath, header + rows.join('\n'), 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

  console.log('\nDataset build complete.');
  console.log('CSV:', csvPath);
  console.log('JSON:', jsonPath);
}

buildDataset().catch(e => { console.error(e); process.exit(1); });
