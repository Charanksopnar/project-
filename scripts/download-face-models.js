#!/usr/bin/env node
/**
 * Script to download face-api.js models
 * Run this script to download required models to public/models directory
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MODELS_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const PUBLIC_MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

// Required models for the application
const REQUIRED_MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'age_gender_model-weights_manifest.json',
  'age_gender_model-shard1'
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadModels() {
  // Create models directory if it doesn't exist
  if (!fs.existsSync(PUBLIC_MODELS_DIR)) {
    fs.mkdirSync(PUBLIC_MODELS_DIR, { recursive: true });
    console.log(`Created directory: ${PUBLIC_MODELS_DIR}`);
  }

  console.log('Downloading face-api.js models...');
  console.log(`Destination: ${PUBLIC_MODELS_DIR}\n`);

  let downloaded = 0;
  let failed = 0;

  for (const model of REQUIRED_MODELS) {
    const url = `${MODELS_BASE_URL}/${model}`;
    const dest = path.join(PUBLIC_MODELS_DIR, model);

    // Skip if file already exists
    if (fs.existsSync(dest)) {
      console.log(`✓ ${model} (already exists)`);
      downloaded++;
      continue;
    }

    try {
      process.stdout.write(`Downloading ${model}... `);
      await downloadFile(url, dest);
      console.log('✓');
      downloaded++;
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nDownload complete!`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\nModels are now available at: ${PUBLIC_MODELS_DIR}`);
}

// Run the script
downloadModels().catch(console.error);

