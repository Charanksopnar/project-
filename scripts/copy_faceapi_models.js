const fs = require('fs');
const path = require('path');

async function copyDir(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
      console.log('Copied', srcPath, '→', destPath);
    }
  }
}

async function main() {
  try {
    const projectRoot = path.join(__dirname, '..');
    const src = path.join(projectRoot, 'node_modules', 'face-api.js', 'weights');
    const dest = path.join(projectRoot, 'public', 'models');

    if (!fs.existsSync(src)) {
      console.error('Source models directory not found:', src);
      console.error('Install dependencies first: npm install');
      process.exit(1);
    }

    await copyDir(src, dest);
    console.log('All model files copied to', dest);
  } catch (err) {
    console.error('Failed to copy model files:', err);
    process.exit(1);
  }
}

main();
