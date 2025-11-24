// Lightweight analyzer stub for development.
// Replace `analyzeFrame` implementation with real model calls (TF/MediaPipe/OpenVINO).

/**
 * analyzeFrame(frameImageData) -> Promise<result>
 * result: { faceCount, faceBboxes: [{x,y,w,h,confidence}], livenessScores: [0.0..1.0], faceConfidenceMin }
 */
export async function analyzeFrame(frame) {
  // Simple mock: randomly simulate 0-2 faces and basic liveness.
  await new Promise(r => setTimeout(r, 5));
  const rand = Math.random();
  let faceCount = 1;
  if (rand < 0.12) faceCount = 0;
  else if (rand > 0.92) faceCount = 2;

  const faceBboxes = [];
  for (let i = 0; i < faceCount; i++) {
    faceBboxes.push({ x: 10 + i * 80, y: 20 + i * 10, w: 80, h: 80, confidence: 0.8 + Math.random() * 0.2 });
  }

  const livenessScores = faceCount > 0 ? [0.7 + Math.random() * 0.3] : [];
  const faceConfidenceMin = faceBboxes.length ? Math.min(...faceBboxes.map(f => f.confidence)) : 0;

  return { faceCount, faceBboxes, livenessScores, faceConfidenceMin };
}

export default { analyzeFrame };
