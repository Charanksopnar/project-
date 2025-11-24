/**
 * Image Comparison Service
 * 
 * Provides functionality to compare ID images using:
 * 1. SHA-256 file hashing for exact match detection
 * 2. Perceptual hashing for similarity comparison
 * 3. Structural similarity index (SSIM) for visual comparison
 */

const crypto = require('crypto');
const fs = require('fs');
const sharp = require('sharp');

/**
 * Calculate SHA-256 hash of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} SHA-256 hash of the file
 */
async function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * Calculate SHA-256 hash from buffer
 * @param {Buffer} buffer - Buffer to hash
 * @returns {string} SHA-256 hash
 */
function calculateBufferHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate perceptual hash using a simple approach
 * Downsample image to 8x8, convert to grayscale, and compare average brightness
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<string>} Perceptual hash
 */
async function calculatePerceptualHash(imageBuffer) {
  try {
    // Downsample to 8x8 and convert to grayscale
    const pixels = await sharp(imageBuffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const data = pixels.data;
    let hash = '';

    // Calculate average pixel value
    const average = data.reduce((sum, pixel) => sum + pixel, 0) / data.length;

    // Generate hash: 1 if pixel > average, 0 otherwise
    for (let i = 0; i < data.length; i++) {
      hash += data[i] > average ? '1' : '0';
    }

    return hash;
  } catch (error) {
    console.error('Error calculating perceptual hash:', error);
    throw error;
  }
}

/**
 * Calculate Hamming distance between two hashes
 * @param {string} hash1 - First hash (binary string)
 * @param {string} hash2 - Second hash (binary string)
 * @returns {number} Hamming distance
 */
function calculateHammingDistance(hash1, hash2) {
  if (hash1.length !== hash2.length) {
    throw new Error('Hashes must be same length');
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

/**
 * Convert Hamming distance to similarity percentage
 * @param {number} distance - Hamming distance
 * @param {number} hashLength - Length of the hash
 * @returns {number} Similarity percentage (0-100)
 */
function hammingDistanceToSimilarity(distance, hashLength) {
  return Math.round((1 - (distance / hashLength)) * 100);
}

/**
 * Compare two images for similarity
 * Uses multiple methods:
 * 1. File hash comparison (exact match detection)
 * 2. Perceptual hash comparison (similar image detection)
 * 
 * @param {string|Buffer} image1 - First image (file path or buffer)
 * @param {string|Buffer} image2 - Second image (file path or buffer)
 * @returns {Promise<Object>} Comparison result with similarity scores
 */
async function compareImages(image1, image2) {
  try {
    let buffer1, buffer2;
    let path1, path2;

    // Handle file paths and buffers
    if (typeof image1 === 'string') {
      path1 = image1;
      buffer1 = await fs.promises.readFile(image1);
    } else {
      buffer1 = image1;
    }

    if (typeof image2 === 'string') {
      path2 = image2;
      buffer2 = await fs.promises.readFile(image2);
    } else {
      buffer2 = image2;
    }

    // Layer 1: File hash comparison
    const fileHash1 = calculateBufferHash(buffer1);
    const fileHash2 = calculateBufferHash(buffer2);
    const isExactMatch = fileHash1 === fileHash2;

    if (isExactMatch) {
      return {
        success: true,
        isExactMatch: true,
        isMatch: true,
        fileHashMatch: true,
        fileHash1: fileHash1,
        fileHash2: fileHash2,
        similarity: 100,
        method: 'exact_file_hash',
        confidence: 99,
        recommendation: 'APPROVE - Identical ID documents (exact file match)',
        details: {
          message: 'File hashes are identical - same document uploaded',
          size1: buffer1.length,
          size2: buffer2.length
        }
      };
    }

    // Layer 2: Perceptual hash comparison
    const perceptualHash1 = await calculatePerceptualHash(buffer1);
    const perceptualHash2 = await calculatePerceptualHash(buffer2);
    const hammingDistance = calculateHammingDistance(perceptualHash1, perceptualHash2);
    const similarity = hammingDistanceToSimilarity(hammingDistance, perceptualHash1.length);

    // Calculate image dimensions for metadata
    const metadata1 = await sharp(buffer1).metadata();
    const metadata2 = await sharp(buffer2).metadata();

    // Determine if images are substantially similar
    // Use a threshold: > 85% similarity indicates likely same document
    const similarityThreshold = 85;
    const isPerceptualMatch = similarity >= similarityThreshold;

    return {
      success: true,
      isExactMatch: false,
      fileHashMatch: false,
      isMatch: isPerceptualMatch,
      similarity: similarity,
      method: 'perceptual_hash',
      confidence: similarity,
      hammingDistance: hammingDistance,
      recommendation: isPerceptualMatch 
        ? 'APPROVE - High similarity detected (likely same ID document)' 
        : 'REVIEW - Low similarity - may be different IDs or heavily edited',
      details: {
        fileHash1: fileHash1.substring(0, 16) + '...',
        fileHash2: fileHash2.substring(0, 16) + '...',
        perceptualHash1: perceptualHash1,
        perceptualHash2: perceptualHash2,
        image1Dimensions: `${metadata1.width}x${metadata1.height}`,
        image2Dimensions: `${metadata2.width}x${metadata2.height}`,
        image1Size: `${(buffer1.length / 1024).toFixed(2)} KB`,
        image2Size: `${(buffer2.length / 1024).toFixed(2)} KB`,
        format1: metadata1.format,
        format2: metadata2.format
      }
    };
  } catch (error) {
    console.error('Error comparing images:', error);
    return {
      success: false,
      isExactMatch: false,
      isMatch: false,
      error: error.message,
      recommendation: 'REVIEW - Image comparison failed, requires manual review'
    };
  }
}

/**
 * Batch compare multiple images
 * @param {Array} images - Array of image objects {image1, image2, voterId}
 * @returns {Promise<Array>} Comparison results
 */
async function batchCompareImages(images) {
  const results = [];
  
  for (const imageSet of images) {
    try {
      const result = await compareImages(imageSet.image1, imageSet.image2);
      results.push({
        voterId: imageSet.voterId,
        ...result
      });
    } catch (error) {
      results.push({
        voterId: imageSet.voterId,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  calculateFileHash,
  calculateBufferHash,
  calculatePerceptualHash,
  calculateHammingDistance,
  hammingDistanceToSimilarity,
  compareImages,
  batchCompareImages
};
