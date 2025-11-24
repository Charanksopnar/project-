/**
 * Minimal multiple person detection stub
 *
 * Exports:
 * - detectMultiplePeopleInFrame(buffer)
 *
 * Returns a simple successful response indicating a single person.
 */

module.exports = {
  async detectMultiplePeopleInFrame(_buffer) {
    return {
      success: true,
      multiplePeopleDetected: false,
      faceCount: 1
    };
  }
};
