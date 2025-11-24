/**
 * Notification Manager
 * Handles all notification emissions to connected clients via Socket.io
 */

let io = null;

// Initialize with Socket.io instance
const setIO = (socketIO) => {
  io = socketIO;
};

// Notification types that match frontend
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
 * Send notification to all connected clients
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 */
const notifyAll = (type, title, message, data = {}) => {
  if (!io) {
    console.warn('Socket.io not initialized for notifications');
    return;
  }

  const notification = {
    type,
    title,
    message,
    timestamp: new Date(),
    data,
  };

  console.log(`📢 Broadcasting notification: ${title}`);
  io.emit('notification', notification);
};

/**
 * Send notification to admin clients only
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 */
const notifyAdmins = (type, title, message, data = {}) => {
  if (!io) {
    console.warn('Socket.io not initialized for notifications');
    return;
  }

  const notification = {
    type,
    title,
    message,
    timestamp: new Date(),
    data,
  };

  console.log(`👤 Sending admin notification: ${title}`);
  io.to('admins').emit('notification', notification);
};

/**
 * Send notification to users only
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 */
const notifyUsers = (type, title, message, data = {}) => {
  if (!io) {
    console.warn('Socket.io not initialized for notifications');
    return;
  }

  const notification = {
    type,
    title,
    message,
    timestamp: new Date(),
    data,
  };

  console.log(`👥 Sending user notification: ${title}`);
  io.to('users').emit('notification', notification);
};

/**
 * Notify candidate creation
 */
const notifyCandidateCreated = (candidateName, partyName) => {
  notifyAll(
    NOTIFICATION_TYPES.CANDIDATE_CREATED,
    'New Candidate Added',
    `${candidateName} from ${partyName} has been added as a candidate`,
    { candidateName, partyName }
  );
};

/**
 * Notify candidate deletion
 */
const notifyCandidateDeleted = (candidateName) => {
  notifyAll(
    NOTIFICATION_TYPES.CANDIDATE_DELETED,
    'Candidate Removed',
    `${candidateName} has been removed from the candidates list`,
    { candidateName }
  );
};

/**
 * Notify candidate edit
 */
const notifyCandidateEdited = (candidateName, changes) => {
  notifyAll(
    NOTIFICATION_TYPES.CANDIDATE_EDITED,
    'Candidate Updated',
    `${candidateName}'s profile has been updated`,
    { candidateName, changes }
  );
};

/**
 * Notify invalid voter
 */
const notifyInvalidVoter = (voterEmail, reason) => {
  notifyAdmins(
    NOTIFICATION_TYPES.INVALID_VOTER,
    'Invalid Voter Detected',
    `${voterEmail} flagged as invalid. Reason: ${reason}`,
    { voterEmail, reason }
  );
};

/**
 * Notify new election
 */
const notifyNewElection = (electionName, startDate, endDate) => {
  notifyAll(
    NOTIFICATION_TYPES.NEW_ELECTION,
    'New Election Created',
    `${electionName} election has been created (${startDate} to ${endDate})`,
    { electionName, startDate, endDate }
  );
};

/**
 * Notify election update
 */
const notifyElectionUpdate = (electionName, updateType, details) => {
  notifyAll(
    NOTIFICATION_TYPES.ELECTION_UPDATE,
    'Election Update',
    `${electionName}: ${updateType}. ${details}`,
    { electionName, updateType, details }
  );
};

/**
 * Notify result update
 */
const notifyResultUpdate = (electionName, leadingCandidate, votes) => {
  notifyAll(
    NOTIFICATION_TYPES.RESULT_UPDATE,
    'Election Results Updated',
    `${electionName} results updated. ${leadingCandidate} is leading with ${votes} votes`,
    { electionName, leadingCandidate, votes }
  );
};

/**
 * Notify rule violation
 */
const notifyRuleViolation = (voterEmail, violation, details) => {
  notifyAdmins(
    NOTIFICATION_TYPES.RULE_VIOLATION,
    'Rule Violation Detected',
    `${voterEmail}: ${violation}. ${details}`,
    { voterEmail, violation, details }
  );
};

/**
 * Notify vote submission
 */
const notifyVoteSubmitted = (voterEmail, electionName) => {
  notifyAdmins(
    NOTIFICATION_TYPES.VOTE_SUBMITTED,
    'Vote Submitted',
    `${voterEmail} has submitted their vote for ${electionName}`,
    { voterEmail, electionName }
  );
};

/**
 * Notify verification failure
 */
const notifyVerificationFailed = (voterEmail, reason) => {
  notifyAdmins(
    NOTIFICATION_TYPES.VERIFICATION_FAILED,
    'Verification Failed',
    `${voterEmail} failed verification. Reason: ${reason}`,
    { voterEmail, reason }
  );
};

module.exports = {
  setIO,
  NOTIFICATION_TYPES,
  notifyAll,
  notifyAdmins,
  notifyUsers,
  notifyCandidateCreated,
  notifyCandidateDeleted,
  notifyCandidateEdited,
  notifyInvalidVoter,
  notifyNewElection,
  notifyElectionUpdate,
  notifyResultUpdate,
  notifyRuleViolation,
  notifyVoteSubmitted,
  notifyVerificationFailed,
};
