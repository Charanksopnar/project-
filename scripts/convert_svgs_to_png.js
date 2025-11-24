const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgDir = path.join(__dirname, '..', 'docs');

async function convertAll() {
  try {
    const files = fs.readdirSync(svgDir).filter(f => f.toLowerCase().endsWith('.svg'));
    if (!files.length) {
      console.log('No SVG files found in', svgDir);
      return;
    }
    for (const file of files) {
      const svgPath = path.join(svgDir, file);
      const outName = file.replace(/\.svg$/i, '.png');
      const outPath = path.join(svgDir, outName);
      try {
        await sharp(svgPath)
          .png({ quality: 90 })
          .toFile(outPath);
        console.log('Wrote', outPath);
      } catch (err) {
        console.error('Failed to convert', svgPath, err.message);
      }
    }
  } catch (err) {
    console.error('Error reading docs directory', err.message);
  }
}

convertAll();
