/**
 * Notification Service
 * Handles sending notifications to connected clients via socket.io
 * Supports various notification types for elections, candidates, voters, etc.
 */

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

let io = null;

/**
 * Initialize the notification service with socket.io instance
 * @param {Server} socketIoInstance - Socket.io server instance
 */
const initializeNotificationService = (socketIoInstance) => {
  io = socketIoInstance;
};

/**
 * Emit a notification to all connected clients or specific users
 * @param {Object} options - Notification options
 * @param {string} options.type - Type of notification
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {Object} options.data - Additional data (optional)
 * @param {string|Array} options.recipientId - User ID(s) to send to (optional, defaults to broadcast)
 * @param {string} options.recipientType - 'user' or 'admin' (optional)
 */
const sendNotification = ({ type, title, message, data = {}, recipientId, recipientType = 'all' }) => {
  if (!io) {
    console.warn('Notification service not initialized');
    return;
  }

  const notification = {
    id: Date.now(),
    type,
    title,
    message,
    data,
    timestamp: new Date(),
    read: false,
  };

  if (recipientId) {
    // Send to specific user(s)
    const recipients = Array.isArray(recipientId) ? recipientId : [recipientId];
    recipients.forEach((id) => {
      io.to(id).emit('notification', notification);
    });
  } else {
    // Broadcast to all connected clients
    if (recipientType === 'admin') {
      io.to('admin').emit('notification', notification);
    } else if (recipientType === 'user') {
      io.to('user').emit('notification', notification);
    } else {
      io.emit('notification', notification);
    }
  }
};

/**
 * Election-related notifications
 */

const notifyElectionCreated = (electionName, startDate, endDate) => {
  sendNotification({
    type: NOTIFICATION_TYPES.NEW_ELECTION,
    title: '🗳️ New Election Created',
    message: `A new election "${electionName}" has been created`,
    data: {
      electionName,
      startDate,
      endDate,
    },
    recipientType: 'all',
  });
};

const notifyElectionUpdate = (electionName, updateType, details) => {
  sendNotification({
    type: NOTIFICATION_TYPES.ELECTION_UPDATE,
    title: '📅 Election Updated',
    message: `Election "${electionName}" has been ${updateType}`,
    data: {
      electionName,
      updateType,
      details,
    },
    recipientType: 'all',
  });
};

const notifyElectionStarted = (electionName, startTime) => {
  sendNotification({
    type: NOTIFICATION_TYPES.ELECTION_UPDATE,
    title: '🎯 Election Started',
    message: `The election "${electionName}" has started`,
    data: {
      electionName,
      startTime,
    },
    recipientType: 'user',
  });
};

const notifyElectionEnded = (electionName, endTime) => {
  sendNotification({
    type: NOTIFICATION_TYPES.ELECTION_UPDATE,
    title: '⏹️ Election Ended',
    message: `The election "${electionName}" has ended`,
    data: {
      electionName,
      endTime,
    },
    recipientType: 'all',
  });
};

/**
 * Candidate-related notifications
 */

const notifyCandidateCreated = (candidateName, electionName) => {
  sendNotification({
    type: NOTIFICATION_TYPES.CANDIDATE_CREATED,
    title: '✨ Candidate Created',
    message: `Candidate "${candidateName}" has been added to "${electionName}"`,
    data: {
      candidateName,
      electionName,
    },
    recipientType: 'admin',
  });
};

const notifyCandidateEdited = (candidateName, electionName, changes) => {
  sendNotification({
    type: NOTIFICATION_TYPES.CANDIDATE_EDITED,
    title: '✏️ Candidate Updated',
    message: `Candidate "${candidateName}" details have been updated`,
    data: {
      candidateName,
      electionName,
      changes,
    },
    recipientType: 'admin',
  });
};

const notifyCandidateDeleted = (candidateName, electionName) => {
  sendNotification({
    type: NOTIFICATION_TYPES.CANDIDATE_DELETED,
    title: '🗑️ Candidate Deleted',
    message: `Candidate "${candidateName}" has been removed from "${electionName}"`,
    data: {
      candidateName,
      electionName,
    },
    recipientType: 'admin',
  });
};

/**
 * Voter-related notifications
 */

const notifyVoteSubmitted = (voterEmail, electionName) => {
  sendNotification({
    type: NOTIFICATION_TYPES.VOTE_SUBMITTED,
    title: '✅ Vote Submitted',
    message: `Your vote for "${electionName}" has been recorded`,
    data: {
      voterEmail,
      electionName,
    },
    recipientId: voterEmail,
  });
};

const notifyInvalidVoter = (voterEmail, reason) => {
  sendNotification({
    type: NOTIFICATION_TYPES.INVALID_VOTER,
    title: '⚠️ Invalid Voter Detected',
    message: `Voter ${voterEmail} has been marked as invalid`,
    data: {
      voterEmail,
      reason,
    },
    recipientType: 'admin',
  });
};

const notifyVerificationFailed = (voterEmail, reason) => {
  sendNotification({
    type: NOTIFICATION_TYPES.VERIFICATION_FAILED,
    title: '❌ Verification Failed',
    message: `Biometric verification failed for ${voterEmail}`,
    data: {
      voterEmail,
      reason,
    },
    recipientId: voterEmail,
  });
};

/**
 * Rule violation notifications
 */

const notifyRuleViolation = (voterEmail, violationType, details) => {
  sendNotification({
    type: NOTIFICATION_TYPES.RULE_VIOLATION,
    title: '🚨 Rule Violation Detected',
    message: `User ${voterEmail} violated election rules: ${violationType}`,
    data: {
      voterEmail,
      violationType,
      details,
    },
    recipientType: 'admin',
  });
};

const notifyProfileChangedTooOften = (voterEmail) => {
  sendNotification({
    type: NOTIFICATION_TYPES.RULE_VIOLATION,
    title: '🚫 Profile Change Limit Exceeded',
    message: `User ${voterEmail} has changed their profile more than allowed times`,
    data: {
      voterEmail,
      reason: 'Profile changed more than 2 times',
    },
    recipientType: 'admin',
  });
};

const notifyVoterBlocked = (voterName, voterEmail, reason) => {
  sendNotification({
    type: NOTIFICATION_TYPES.RULE_VIOLATION,
    title: 'Voter Blocked',
    message: `Voter "${voterName}" (${voterEmail}) has been blocked`,
    data: {
      voterName,
      voterEmail,
      reason: reason || 'Administrative action',
      action: 'VOTER_BLOCKED',
    },
    recipientType: 'admin',
  });
};

const notifyVoterUnblocked = (voterName, voterEmail) => {
  sendNotification({
    type: NOTIFICATION_TYPES.RULE_VIOLATION,
    title: 'Voter Unblocked',
    message: `Voter "${voterName}" (${voterEmail}) has been unblocked`,
    data: {
      voterName,
      voterEmail,
      action: 'VOTER_UNBLOCKED',
    },
    recipientType: 'admin',
  });
};

/**
 * Result-related notifications
 */

const notifyResultsAvailable = (electionName, resultSummary) => {
  sendNotification({
    type: NOTIFICATION_TYPES.RESULT_UPDATE,
    title: '📊 Results Available',
    message: `Results for "${electionName}" are now available`,
    data: {
      electionName,
      resultSummary,
    },
    recipientType: 'all',
  });
};

const notifyResultsUpdated = (electionName, updateInfo) => {
  sendNotification({
    type: NOTIFICATION_TYPES.RESULT_UPDATE,
    title: '📈 Results Updated',
    message: `Results for "${electionName}" have been updated`,
    data: {
      electionName,
      updateInfo,
    },
    recipientType: 'all',
  });
};

module.exports = {
  NOTIFICATION_TYPES,
  initializeNotificationService,
  sendNotification,
  // Election notifications
  notifyElectionCreated,
  notifyElectionUpdate,
  notifyElectionStarted,
  notifyElectionEnded,
  // Candidate notifications
  notifyCandidateCreated,
  notifyCandidateEdited,
  notifyCandidateDeleted,
  // Voter notifications
  notifyVoteSubmitted,
  notifyInvalidVoter,
  notifyVerificationFailed,
  // Rule violation notifications
  notifyRuleViolation,
  notifyProfileChangedTooOften,
  notifyVoterBlocked,
  notifyVoterUnblocked,
  // Result notifications
  notifyResultsAvailable,
  notifyResultsUpdated,
};
