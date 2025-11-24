export function createPolicySession({ voterId, electionId, config = {} } = {}) {
  const cfg = {
    multipleConfidenceThreshold: 0.75,
    multiplePersistenceMs: config.multiplePersistenceMs || 2000,
    livenessThreshold: config.livenessThreshold || 0.6,
    livenessPersistenceMs: config.livenessPersistenceMs || 1500,
    maxLivenessFails: config.maxLivenessFails || 3
  };

  let warnings = 0;
  let blocked = false;
  let lastMultipleStart = null;
  let lastLivenessFailStart = null;
  let livenessFailCount = 0;

  function getState() {
    return { voterId, electionId, warnings, blocked };
  }

  function handleDetection(result) {
    const now = Date.now();
    if (blocked) return { action: 'block', warningsCount: warnings, blocked };

    const multiCond = result.faceCount > 1 && (result.faceConfidenceMin || 0) >= cfg.multipleConfidenceThreshold;
    if (multiCond) {
      if (!lastMultipleStart) lastMultipleStart = now;
      if (now - lastMultipleStart >= cfg.multiplePersistenceMs) {
        lastMultipleStart = null;
        warnings += 1;
        if (warnings >= 3) {
          blocked = true;
          const auditRef = `audit_${voterId}_${electionId}_${Date.now()}`;
          return { action: 'block', warningsCount: warnings, reason: 'multiple_persons_3rd_warning', auditRef };
        }
        const msg = warnings === 1 ? 'Multiple people detected in view. Please ensure only you are in the camera view. This is your 1st warning.' : 'Multiple people still detected. This is your 2nd and final warning. If it happens again your vote will be blocked for this election.';
        return { action: 'warn', warningsCount: warnings, message: msg };
      }
    } else {
      lastMultipleStart = null;
    }

    const primaryLiveness = (result.livenessScores && result.livenessScores[0]) ?? undefined;
    if (primaryLiveness !== undefined && primaryLiveness < cfg.livenessThreshold) {
      if (!lastLivenessFailStart) lastLivenessFailStart = now;
      if (now - lastLivenessFailStart >= cfg.livenessPersistenceMs) {
        lastLivenessFailStart = null;
        livenessFailCount += 1;
        if (livenessFailCount >= cfg.maxLivenessFails) {
          blocked = true;
          const auditRef = `audit_liveness_${voterId}_${electionId}_${Date.now()}`;
          return { action: 'manual_review', warningsCount: warnings, reason: 'liveness_failures', auditRef };
        }
        return { action: 'warn', warningsCount: warnings, message: 'Liveness check failed. Please move closer and follow the prompts.' };
      }
    } else {
      lastLivenessFailStart = null;
    }

    return null;
  }

  return { handleDetection, getState };
}

export default { createPolicySession };
