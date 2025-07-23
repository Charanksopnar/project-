/**
 * Face Recognition Module
 *
 * This module handles face detection, recognition, and matching for the voting system.
 * It uses TensorFlow.js and face-api.js for face recognition capabilities.
 */

const tf = require('@tensorflow/tfjs-node');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const fs = require('fs');
const path = require('path');

// Configure face-api.js to use canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Path to face recognition models
const MODELS_PATH = path.join(__dirname, '../models');

// Initialize face detection models
async function loadModels() {
  try {
    // Load the required models
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH);
    await faceapi.nets.faceExpressionNet.loadFromDisk(MODELS_PATH);

    console.log('Face recognition models loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    return false;
  }
}

/**
 * Detect faces in an image
 * @param {Buffer} imageBuffer - The image buffer to analyze
 * @returns {Promise<Object>} - Detection results
 */
async function detectFaces(imageBuffer) {
  try {
    // Load the image
    const img = await canvas.loadImage(imageBuffer);

    // Detect all faces and get face descriptions
    const detections = await faceapi.detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withFaceExpressions();

    return {
      success: true,
      faceCount: detections.length,
      detections: detections
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Compare a face with a stored reference face
 * @param {Buffer} currentFaceBuffer - Current face image buffer
 * @param {Buffer} storedFaceBuffer - Stored reference face image buffer
 * @param {Object} options - Comparison options
 * @param {number} options.minThreshold - Minimum similarity threshold (default: 0.6)
 * @param {number} options.maxThreshold - Maximum similarity threshold (default: 0.8)
 * @returns {Promise<Object>} - Comparison results
 */
async function compareFaces(currentFaceBuffer, storedFaceBuffer, options = {}) {
  try {
    console.log('Starting face comparison...');

    // Default thresholds (60% to 80% similarity)
    const minThreshold = options.minThreshold || 0.6;
    const maxThreshold = options.maxThreshold || 0.8;

    // Load both images
    const currentImg = await canvas.loadImage(currentFaceBuffer);
    const storedImg = await canvas.loadImage(storedFaceBuffer);

    console.log('Images loaded successfully. Detecting faces...');

    // Get face descriptions with more detailed detection options
    const currentFaceDetectionOptions = new faceapi.SsdMobilenetv1Options({
      minConfidence: 0.5,
      maxResults: 1
    });

    const storedFaceDetectionOptions = new faceapi.SsdMobilenetv1Options({
      minConfidence: 0.5,
      maxResults: 1
    });

    // Detect faces with enhanced options
    const currentFaceDescriptions = await faceapi.detectSingleFace(currentImg, currentFaceDetectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    const storedFaceDescriptions = await faceapi.detectSingleFace(storedImg, storedFaceDetectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Validate face detection results
    if (!currentFaceDescriptions) {
      console.error('Failed to detect face in current image');
      return {
        success: false,
        error: 'Could not detect face in the current image. Please ensure your face is clearly visible.'
      };
    }

    if (!storedFaceDescriptions) {
      console.error('Failed to detect face in stored image');
      return {
        success: false,
        error: 'Could not detect face in the stored image. Please ensure the ID has a clear face photo.'
      };
    }

    console.log('Faces detected successfully. Comparing face descriptors...');

    // Compare face descriptors
    const distance = faceapi.euclideanDistance(
      currentFaceDescriptions.descriptor,
      storedFaceDescriptions.descriptor
    );

    // Calculate similarity (0 to 1, where 1 is perfect match)
    const similarity = 1 - distance;

    // Convert to percentage
    const similarityPercentage = Math.round(similarity * 100);

    console.log(`Face comparison complete. Similarity: ${similarityPercentage}%`);

    // Check if similarity is within acceptable range
    const isMatch = similarity >= minThreshold && similarity <= maxThreshold;

    // Get additional face details for debugging
    const currentFaceBox = currentFaceDescriptions.detection.box;
    const storedFaceBox = storedFaceDescriptions.detection.box;

    return {
      success: true,
      isMatch: isMatch,
      similarity: similarity,
      similarityPercentage: similarityPercentage,
      distance: distance,
      thresholds: {
        min: minThreshold,
        max: maxThreshold
      },
      details: {
        currentFace: {
          confidence: currentFaceDescriptions.detection.score,
          box: {
            x: currentFaceBox.x,
            y: currentFaceBox.y,
            width: currentFaceBox.width,
            height: currentFaceBox.height
          }
        },
        storedFace: {
          confidence: storedFaceDescriptions.detection.score,
          box: {
            x: storedFaceBox.x,
            y: storedFaceBox.y,
            width: storedFaceBox.width,
            height: storedFaceBox.height
          }
        }
      }
    };
  } catch (error) {
    console.error('Error comparing faces:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Detect if multiple people are present in the image
 * @param {Buffer} imageBuffer - The image buffer to analyze
 * @returns {Promise<Object>} - Detection results
 */
async function detectMultiplePeople(imageBuffer) {
  try {
    const result = await detectFaces(imageBuffer);

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      multiplePeopleDetected: result.faceCount > 1,
      faceCount: result.faceCount
    };
  } catch (error) {
    console.error('Error detecting multiple people:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Compare multiple faces (selfie, ID, and video frame)
 * @param {Buffer} selfieBuffer - Selfie image buffer
 * @param {Buffer} idBuffer - ID image buffer
 * @param {Buffer} videoBuffer - Video frame buffer (optional)
 * @param {Object} options - Comparison options
 * @returns {Promise<Object>} - Comparison results
 */
async function compareMultipleFaces(selfieBuffer, idBuffer, videoBuffer = null, options = {}) {
  try {
    console.log('Starting multiple face comparison...');
    console.log(`Video buffer provided: ${videoBuffer !== null}`);

    // First, check if we can detect faces in all images
    const selfieDetection = await detectFaces(selfieBuffer);
    const idDetection = await detectFaces(idBuffer);

    // Validate face detection in selfie and ID
    if (!selfieDetection.success || selfieDetection.faceCount === 0) {
      return {
        success: false,
        error: 'Could not detect a face in your selfie. Please ensure your face is clearly visible.',
        verificationStep: 'face_detection',
        image: 'selfie'
      };
    }

    if (!idDetection.success || idDetection.faceCount === 0) {
      return {
        success: false,
        error: 'Could not detect a face in your ID document. Please ensure the ID has a clear face photo.',
        verificationStep: 'face_detection',
        image: 'id'
      };
    }

    // Check for multiple faces in selfie (security check)
    if (selfieDetection.faceCount > 1) {
      return {
        success: false,
        error: `Multiple faces detected in your selfie (${selfieDetection.faceCount} faces). Please ensure only your face is visible.`,
        verificationStep: 'security_violation',
        violationType: 'multiple_faces',
        image: 'selfie'
      };
    }

    // Video frame detection if provided
    let videoDetection = null;
    if (videoBuffer) {
      videoDetection = await detectFaces(videoBuffer);

      if (!videoDetection.success || videoDetection.faceCount === 0) {
        return {
          success: false,
          error: 'Could not detect a face in your video frame. Please ensure your face is clearly visible.',
          verificationStep: 'face_detection',
          image: 'video'
        };
      }

      // Check for multiple faces in video (security check)
      if (videoDetection.faceCount > 1) {
        return {
          success: false,
          error: `Multiple faces detected in your video (${videoDetection.faceCount} faces). Please ensure only your face is visible.`,
          verificationStep: 'security_violation',
          violationType: 'multiple_faces',
          image: 'video'
        };
      }
    }

    console.log('Face detection successful in all provided images. Proceeding with comparison...');

    // Compare selfie with ID
    const selfieToIdComparison = await compareFaces(selfieBuffer, idBuffer, options);

    let selfieToVideoComparison = { success: false };
    let idToVideoComparison = { success: false };

    // If video frame is provided, compare with selfie and ID
    if (videoBuffer) {
      selfieToVideoComparison = await compareFaces(selfieBuffer, videoBuffer, options);
      idToVideoComparison = await compareFaces(idBuffer, videoBuffer, options);
    }

    // Calculate overall match status
    const allComparisonsSuccessful = selfieToIdComparison.success &&
      (!videoBuffer || (selfieToVideoComparison.success && idToVideoComparison.success));

    // For a successful match, all comparisons must be successful and within threshold
    const allMatched = selfieToIdComparison.isMatch &&
      (!videoBuffer || (selfieToVideoComparison.isMatch && idToVideoComparison.isMatch));

    // Calculate average similarity if all comparisons were successful
    let averageSimilarity = 0;
    let averageSimilarityPercentage = 0;
    let weightedSimilarityPercentage = 0;

    if (allComparisonsSuccessful) {
      if (videoBuffer) {
        // Give more weight to the selfie-to-video comparison (real-time verification)
        // Weights: selfie-to-video (50%), selfie-to-id (30%), id-to-video (20%)
        averageSimilarity = (
          selfieToIdComparison.similarity * 0.3 +
          selfieToVideoComparison.similarity * 0.5 +
          idToVideoComparison.similarity * 0.2
        );

        // Simple average for comparison
        const simpleSimilarity = (
          selfieToIdComparison.similarity +
          selfieToVideoComparison.similarity +
          idToVideoComparison.similarity
        ) / 3;

        averageSimilarityPercentage = Math.round(simpleSimilarity * 100);
        weightedSimilarityPercentage = Math.round(averageSimilarity * 100);
      } else {
        averageSimilarity = selfieToIdComparison.similarity;
        averageSimilarityPercentage = selfieToIdComparison.similarityPercentage;
        weightedSimilarityPercentage = averageSimilarityPercentage;
      }
    }

    // Determine the reason for failure if not all matched
    let failureReason = null;
    if (allComparisonsSuccessful && !allMatched) {
      if (!selfieToIdComparison.isMatch) {
        failureReason = 'Selfie does not match ID photo';
      } else if (videoBuffer && !selfieToVideoComparison.isMatch) {
        failureReason = 'Live video does not match selfie';
      } else if (videoBuffer && !idToVideoComparison.isMatch) {
        failureReason = 'Live video does not match ID photo';
      }
    }

    console.log(`Multiple face comparison complete. Overall match: ${allMatched}`);
    console.log(`Average similarity: ${averageSimilarityPercentage}%, Weighted: ${weightedSimilarityPercentage}%`);

    return {
      success: allComparisonsSuccessful,
      isMatch: allMatched,
      averageSimilarity: averageSimilarity,
      averageSimilarityPercentage: averageSimilarityPercentage,
      weightedSimilarityPercentage: weightedSimilarityPercentage,
      failureReason: failureReason,
      comparisons: {
        selfieToId: selfieToIdComparison,
        selfieToVideo: videoBuffer ? selfieToVideoComparison : null,
        idToVideo: videoBuffer ? idToVideoComparison : null
      },
      detections: {
        selfie: selfieDetection,
        id: idDetection,
        video: videoDetection
      },
      thresholds: options.thresholds || {
        min: options.minThreshold || 0.6,
        max: options.maxThreshold || 0.8
      }
    };
  } catch (error) {
    console.error('Error comparing multiple faces:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  loadModels,
  detectFaces,
  compareFaces,
  detectMultiplePeople,
  compareMultipleFaces
};
