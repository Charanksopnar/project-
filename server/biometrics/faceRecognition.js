/**
 * Minimal face recognition stub
 *
 * Exports simple async functions used by other modules:
 * - detectFaces(buffer)
 * - compareFaces(bufferA, bufferB)
 *
 * These are placeholders to allow the server to run during development.
 */

module.exports = {
  async detectFaces(_buffer) {
    return {
      success: true,
      faceCount: 1,
      faces: []
    };
  },

  async compareFaces(_bufferA, _bufferB) {
    return {
      success: true,
      isMatch: true,
      confidence: 0.95
    };
  }
};
