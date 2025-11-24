/**
 * Image Comparison Service
 * Compares images using SHA-256 hash and perceptual hash (pHash)
 */

const crypto = require('crypto');
const fs = require('fs');
const imghash = require('imghash');
const sharp = require('sharp');

/**
 * Calculate SHA-256 hash of a file
 */
function calculateSHA256(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

/**
 * Calculate perceptual hash (pHash) of an image
 */
async function calculatePerceptualHash(filePath) {
    try {
        const hash = await imghash.hash(filePath, 16); // 16-bit hash
        return hash;
    } catch (error) {
        console.error('Perceptual hash calculation error:', error);
        throw error;
    }
}

/**
 * Calculate Hamming distance between two hashes
 * Used to determine similarity between perceptual hashes
 */
function hammingDistance(hash1, hash2) {
    if (hash1.length !== hash2.length) {
        throw new Error('Hashes must be of equal length');
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
 * Calculate similarity percentage from Hamming distance
 * Lower distance = higher similarity
 */
function calculateSimilarity(hash1, hash2) {
    const distance = hammingDistance(hash1, hash2);
    const maxDistance = hash1.length * 4; // Each hex char represents 4 bits
    const similarity = ((maxDistance - distance) / maxDistance) * 100;
    return Math.max(0, Math.min(100, similarity)); // Clamp between 0-100
}

/**
 * Compare two images using SHA-256 hash
 * Returns true if images are identical
 */
async function compareImagesBySHA256(filePath1, filePath2) {
    try {
        const hash1 = await calculateSHA256(filePath1);
        const hash2 = await calculateSHA256(filePath2);

        const isIdentical = hash1 === hash2;

        return {
            success: true,
            method: 'SHA-256',
            hash1: hash1,
            hash2: hash2,
            isIdentical: isIdentical,
            similarity: isIdentical ? 100 : 0
        };
    } catch (error) {
        console.error('SHA-256 comparison error:', error);
        return {
            success: false,
            method: 'SHA-256',
            error: error.message,
            isIdentical: false,
            similarity: 0
        };
    }
}

/**
 * Compare two images using perceptual hash (pHash)
 * Returns similarity percentage
 */
async function compareImagesByPHash(filePath1, filePath2) {
    try {
        const hash1 = await calculatePerceptualHash(filePath1);
        const hash2 = await calculatePerceptualHash(filePath2);

        const similarity = calculateSimilarity(hash1, hash2);

        return {
            success: true,
            method: 'pHash',
            hash1: hash1,
            hash2: hash2,
            similarity: Math.round(similarity),
            isMatch: similarity >= 90 // Consider match if >= 90% similar
        };
    } catch (error) {
        console.error('pHash comparison error:', error);
        return {
            success: false,
            method: 'pHash',
            error: error.message,
            similarity: 0,
            isMatch: false
        };
    }
}

/**
 * Comprehensive image comparison
 * Performs both SHA-256 and pHash comparison
 */
async function compareImages(filePath1, filePath2, options = {}) {
    const {
        pHashThreshold = 90, // Similarity threshold for pHash
        skipPHashIfSHA256Match = true
    } = options;

    try {
        console.log('Starting image comparison...');
        console.log('Image 1:', filePath1);
        console.log('Image 2:', filePath2);

        // Step 1: SHA-256 comparison (fast, exact match)
        const sha256Result = await compareImagesBySHA256(filePath1, filePath2);

        if (sha256Result.isIdentical) {
            console.log('✓ Images are identical (SHA-256 match)');
            return {
                success: true,
                matched: true,
                matchMethod: 'SHA-256',
                sha256: sha256Result,
                pHash: null,
                similarity: 100,
                autoVerify: true
            };
        }

        // Step 2: pHash comparison (slower, similarity match)
        if (!skipPHashIfSHA256Match || !sha256Result.isIdentical) {
            console.log('SHA-256 no match, trying pHash...');
            const pHashResult = await compareImagesByPHash(filePath1, filePath2);

            if (pHashResult.similarity >= pHashThreshold) {
                console.log(`✓ Images are similar (pHash: ${pHashResult.similarity}%)`);
                return {
                    success: true,
                    matched: true,
                    matchMethod: 'pHash',
                    sha256: sha256Result,
                    pHash: pHashResult,
                    similarity: pHashResult.similarity,
                    autoVerify: true
                };
            }

            console.log(`✗ Images do not match (pHash: ${pHashResult.similarity}%)`);
            return {
                success: true,
                matched: false,
                matchMethod: null,
                sha256: sha256Result,
                pHash: pHashResult,
                similarity: pHashResult.similarity,
                autoVerify: false
            };
        }

        return {
            success: true,
            matched: false,
            matchMethod: null,
            sha256: sha256Result,
            pHash: null,
            similarity: 0,
            autoVerify: false
        };
    } catch (error) {
        console.error('Image comparison error:', error);
        return {
            success: false,
            matched: false,
            error: error.message,
            autoVerify: false
        };
    }
}

module.exports = {
    calculateSHA256,
    calculatePerceptualHash,
    compareImagesBySHA256,
    compareImagesByPHash,
    compareImages,
    calculateSimilarity,
    hammingDistance
};
