/**
 * Notification Emitter Utility
 * Handles emitting notifications to all connected clients via Socket.io
 */

let io = null;

/**
 * Initialize the notification emitter with the Socket.io instance
 * Call this in server.js after creating the io object
 */
function initializeNotificationEmitter(socketIoInstance) {
  io = socketIoInstance;
  console.log('✅ Notification emitter initialized');
}

/**
 * Emit a notification to all connected clients
 * @param {string} type - Type of notification (election_update, candidate_created, invalid_voter, etc.)
 * @param {object} data - Notification data
 */
function emitNotification(type, data) {
  if (!io) {
    console.error('❌ Socket.io not initialized for notifications');
    return;
  }

  const notification = {
    id: Date.now().toString(),
    type,
    message: generateNotificationMessage(type, data),
    data,
    timestamp: new Date(),
    read: false
  };

  console.log(`📢 Emitting notification - Type: ${type}`, notification);
  
  // Emit to all connected clients
  io.emit('newNotification', notification);
  
  return notification;
}

/**
 * Generate human-readable message based on notification type
 */
function generateNotificationMessage(type, data) {
  const messages = {
    election_started: `Election "${data.electionName || 'Unknown'}" has started!`,
    election_ended: `Election "${data.electionName || 'Unknown'}" has ended!`,
    election_created: `New election "${data.electionName || 'Unknown'}" has been created`,
    election_updated: `Election "${data.electionName || 'Unknown'}" has been updated`,
    election_deleted: `Election "${data.electionName || 'Unknown'}" has been deleted`,
    
    candidate_created: `New candidate "${data.candidateName || 'Unknown'}" has been registered`,
    candidate_updated: `Candidate "${data.candidateName || 'Unknown'}" profile has been updated`,
    candidate_deleted: `Candidate "${data.candidateName || 'Unknown'}" has been removed`,
    
    invalid_voter: `⚠️ Invalid voter detected: ${data.voterName || 'Unknown voter'}`,
    invalid_voter_resolved: `Invalid voter issue resolved for ${data.voterName || 'Unknown voter'}`,
    
    rule_violation: `⚠️ Rule violation detected for ${data.voterName || 'Unknown voter'}: ${data.violation || 'Unauthorized action'}`,
    
    result_update: `📊 Results updated! ${data.details || 'New votes recorded'}`,
    
    profile_edit_warning: `⚠️ ${data.voterName || 'User'} has edited profile more than 2 times (${data.editCount} edits)`,
    
    vote_submitted: `✅ Vote submitted successfully`,
    
    default: data.message || 'New notification'
  };

  return messages[type] || messages.default;
}

/**
 * Emit candidate-related notifications
 */
function notifyCandidate(action, candidateData) {
  const typeMap = {
    create: 'candidate_created',
    update: 'candidate_updated',
    delete: 'candidate_deleted'
  };

  return emitNotification(typeMap[action], {
    candidateName: candidateData.firstName,
    candidateId: candidateData._id,
    party: candidateData.party,
    action
  });
}

/**
 * Emit election-related notifications
 */
function notifyElection(action, electionData) {
  const typeMap = {
    create: 'election_created',
    update: 'election_updated',
    delete: 'election_deleted',
    start: 'election_started',
    end: 'election_ended'
  };

  return emitNotification(typeMap[action], {
    electionName: electionData.name || electionData.electionName,
    electionId: electionData._id,
    startDate: electionData.startDate,
    endDate: electionData.endDate,
    action
  });
}

/**
 * Notify about invalid voters
 */
function notifyInvalidVoter(voterData, reason) {
  return emitNotification('invalid_voter', {
    voterName: voterData.firstName + ' ' + voterData.lastName,
    voterId: voterData._id,
    email: voterData.email,
    reason,
    timestamp: new Date()
  });
}

/**
 * Notify about rule violations
 */
function notifyRuleViolation(voterData, violation, details = {}) {
  return emitNotification('rule_violation', {
    voterName: voterData.firstName + ' ' + voterData.lastName,
    voterId: voterData._id,
    violation,
    ...details,
    timestamp: new Date()
  });
}

/**
 * Notify about profile edit violations (more than 2 edits)
 */
function notifyProfileEditViolation(voterData, editCount) {
  return emitNotification('profile_edit_warning', {
    voterName: voterData.firstName + ' ' + voterData.lastName,
    voterId: voterData._id,
    editCount,
    maxAllowed: 2,
    timestamp: new Date()
  });
}

/**
 * Notify about result updates
 */
function notifyResultUpdate(details) {
  return emitNotification('result_update', {
    details,
    timestamp: new Date()
  });
}

/**
 * Notify about vote submission
 */
function notifyVoteSubmitted(voterData, candidateName) {
  return emitNotification('vote_submitted', {
    voterName: voterData.firstName + ' ' + voterData.lastName,
    candidateName,
    timestamp: new Date()
  });
}

module.exports = {
  initializeNotificationEmitter,
  emitNotification,
  notifyCandidate,
  notifyElection,
  notifyInvalidVoter,
  notifyRuleViolation,
  notifyProfileEditViolation,
  notifyResultUpdate,
  notifyVoteSubmitted
};
