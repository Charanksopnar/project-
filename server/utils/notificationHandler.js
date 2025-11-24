/**
 * Notification Handler - Emits notifications via Socket.io to connected clients
 * This utility is used throughout the backend to trigger notifications
 */

// Map of notification types
const NOTIFICATION_TYPES = {
  ELECTION_UPDATE: 'election_update',
  CANDIDATE_CREATED: 'candidate_created',
  CANDIDATE_DELETED: 'candidate_deleted',
  CANDIDATE_EDITED: 'candidate_edited',
  INVALID_VOTER: 'invalid_voter',
  NEW_ELECTION: 'new_election',
  RESULT_UPDATE: 'result_update',
  RULE_VIOLATION: 'rule_violation',
  VOTE_SUBMITTED: 'vote_submitted',
  VERIFICATION_FAILED: 'verification_failed',
};

/**
 * Emit a notification to all connected clients
 * @param {Object} io - Socket.io instance
 * @param {string} type - Notification type (use NOTIFICATION_TYPES)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional notification data (optional)
 */
function emitNotification(io, type, title, message, data = {}) {
  if (!io) {
    console.warn('[Notification] Socket.io instance not available');
    return;
  }

  const notification = {
    type,
    title,
    message,
    data,
    timestamp: new Date(),
  };

  // Emit to all connected clients
  io.emit('notification', notification);
  console.log(`[Notification] ${title}: ${message}`);
}

/**
 * Emit candidate creation notification
 */
function notifyCandidateCreated(io, candidateName, electionName) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.CANDIDATE_CREATED,
    '✨ Candidate Created',
    `${candidateName} has been added as a candidate.`,
    { candidateName, electionName }
  );
}

/**
 * Emit candidate edit notification
 */
function notifyCandidateEdited(io, candidateName, electionName) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.CANDIDATE_EDITED,
    '✏️ Candidate Updated',
    `${candidateName} information has been updated.`,
    { candidateName, electionName }
  );
}

/**
 * Emit candidate deletion notification
 */
function notifyCandidateDeleted(io, candidateName, electionName) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.CANDIDATE_DELETED,
    '🗑️ Candidate Removed',
    `${candidateName} has been removed from the candidate list.`,
    { candidateName, electionName }
  );
}

/**
 * Emit election creation notification
 */
function notifyElectionCreated(io, electionName, startDate, endDate) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.NEW_ELECTION,
    '🗳️ New Election Created',
    `Election "${electionName}" has been created.`,
    { electionName, startDate, endDate }
  );
}

/**
 * Emit election update notification (start/end time or status change)
 */
function notifyElectionUpdated(io, electionName, updateInfo) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.ELECTION_UPDATE,
    '📅 Election Updated',
    `Election "${electionName}" has been updated: ${updateInfo}`,
    { electionName, details: updateInfo }
  );
}

/**
 * Emit election started notification
 */
function notifyElectionStarted(io, electionName, startTime) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.ELECTION_UPDATE,
    '📅 Election Started',
    `Election "${electionName}" has started at ${startTime}`,
    { electionName, startTime }
  );
}

/**
 * Emit election ended notification
 */
function notifyElectionEnded(io, electionName, endTime) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.ELECTION_UPDATE,
    '📅 Election Ended',
    `Election "${electionName}" has ended at ${endTime}`,
    { electionName, endTime }
  );
}

/**
 * Emit invalid voter notification
 */
function notifyInvalidVoter(io, voterEmail, reason) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.INVALID_VOTER,
    '⚠️ Invalid Voter Detected',
    `Voter ${voterEmail} has been marked as invalid.`,
    { voterEmail, reason }
  );
}

/**
 * Emit result update notification
 */
function notifyResultUpdated(io, electionName, resultsSummary) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.RESULT_UPDATE,
    '📊 Results Updated',
    `Results for "${electionName}" are now available.`,
    { electionName, details: resultsSummary }
  );
}

/**
 * Emit rule violation notification
 */
function notifyRuleViolation(io, voterEmail, reason, details = '') {
  emitNotification(
    io,
    NOTIFICATION_TYPES.RULE_VIOLATION,
    '🚨 Rule Violation Detected',
    `${reason} by voter: ${voterEmail}`,
    { voterEmail, reason, details }
  );
}

/**
 * Emit vote submitted notification
 */
function notifyVoteSubmitted(io, voterEmail, electionName) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.VOTE_SUBMITTED,
    '✅ Vote Submitted',
    `Vote successfully recorded for election "${electionName}".`,
    { voterEmail, electionName }
  );
}

/**
 * Emit verification failed notification
 */
function notifyVerificationFailed(io, voterEmail, reason) {
  emitNotification(
    io,
    NOTIFICATION_TYPES.VERIFICATION_FAILED,
    '❌ Verification Failed',
    `Verification failed for voter ${voterEmail}: ${reason}`,
    { voterEmail, reason }
  );
}

module.exports = {
  NOTIFICATION_TYPES,
  emitNotification,
  notifyCandidateCreated,
  notifyCandidateEdited,
  notifyCandidateDeleted,
  notifyElectionCreated,
  notifyElectionUpdated,
  notifyElectionStarted,
  notifyElectionEnded,
  notifyInvalidVoter,
  notifyResultUpdated,
  notifyRuleViolation,
  notifyVoteSubmitted,
  notifyVerificationFailed,
};
