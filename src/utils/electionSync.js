/**
 * Election Synchronization Utility
 * Manages real-time election state across the application
 * Handles automatic UI updates when elections are created, modified, or status changes
 */

/**
 * Converts backend election data to frontend format
 * @param {Object} election - Backend election object
 * @returns {Object} Formatted election object
 */
export const formatElectionData = (election) => {
  return {
    id: election._id?.toString() || election.id,
    name: election.name,
    title: election.title || election.name,
    description: election.description,
    status: election.status || 'upcoming',
    startDate: election.startDate || election.date,
    endDate: election.endDate,
    date: election.date || election.startDate,
    autoStart: election.autoStart ?? true,
    showTimer: election.showTimer ?? true,
    createdAt: election.createdAt
  };
};

/**
 * Merges new election data with existing elections list
 * Handles creation, modification, and deletion
 * @param {Array} currentElections - Current elections array
 * @param {Object|Array} newData - New election(s) data
 * @param {String} actionType - 'created', 'modified', 'deleted', 'statusChanged', or 'full'
 * @returns {Array} Updated elections array
 */
export const mergeElectionData = (currentElections = [], newData, actionType = 'full') => {
  switch (actionType) {
    case 'created':
      const formattedNew = formatElectionData(newData);
      // Check if election already exists
      if (currentElections.some(el => el.id === formattedNew.id)) {
        return currentElections;
      }
      return [...currentElections, formattedNew];

    case 'modified':
    case 'statusChanged':
      const formattedModified = formatElectionData(newData);
      return currentElections.map(el =>
        el.id === formattedModified.id ? { ...el, ...formattedModified } : el
      );

    case 'deleted':
      return currentElections.filter(el => el.id !== newData._id?.toString() && el.id !== newData.id);

    case 'full':
      // Complete replacement with new data
      if (Array.isArray(newData)) {
        return newData.map(formatElectionData);
      }
      return currentElections;

    default:
      return currentElections;
  }
};

/**
 * Determines election button state and text based on status
 * @param {Object} election - Election object
 * @param {Boolean} userHasVoted - Whether user has already voted
 * @returns {Object} { buttonText, isEnabled, backgroundColor }
 */
export const getElectionButtonState = (election, userHasVoted = false) => {
  let buttonText = 'Not Available';
  let isEnabled = false;
  let backgroundColor = '#999';

  if (userHasVoted) {
    buttonText = 'Already Voted';
    isEnabled = false;
    backgroundColor = '#999';
  } else if (election.status === 'upcoming') {
    buttonText = 'Not Available';
    isEnabled = false;
    backgroundColor = '#999';
  } else if (election.status === 'current') {
    buttonText = 'Participate/Vote';
    isEnabled = true;
    backgroundColor = '#2ecc71';
  } else if (election.status === 'stopped' || election.status === 'completed') {
    buttonText = 'Ended';
    isEnabled = false;
    backgroundColor = '#999';
  }

  return { buttonText, isEnabled, backgroundColor };
};

/**
 * Gets CSS styling for election card based on status
 * @param {Object} election - Election object
 * @returns {Object} CSS style object
 */
export const getElectionCardStyle = (election) => {
  const baseStyle = {
    opacity: 1,
    borderWidth: '1px',
    transition: 'all 0.3s ease'
  };

  if (election.status === 'current') {
    return {
      ...baseStyle,
      opacity: 1,
      borderColor: '#2ecc71',
      borderWidth: '2px',
      boxShadow: '0 0 10px rgba(46, 204, 113, 0.3)'
    };
  } else if (election.status === 'upcoming') {
    return {
      ...baseStyle,
      opacity: 0.8,
      borderColor: 'inherit',
      borderWidth: '1px'
    };
  } else if (election.status === 'stopped' || election.status === 'completed') {
    return {
      ...baseStyle,
      opacity: 0.6,
      borderColor: '#999',
      borderWidth: '1px'
    };
  }

  return baseStyle;
};

/**
 * Checks if two elections are the same
 * @param {Object} el1 - First election
 * @param {Object} el2 - Second election
 * @returns {Boolean}
 */
export const electionsAreEqual = (el1, el2) => {
  if (!el1 || !el2) return false;
  return (el1._id?.toString() || el1.id) === (el2._id?.toString() || el2.id);
};

/**
 * Finds an election by ID in the list
 * @param {Array} elections - Elections array
 * @param {String|Number} electionId - Election ID to find
 * @returns {Object|undefined} Found election or undefined
 */
export const findElectionById = (elections = [], electionId) => {
  return elections.find(el => 
    el.id === electionId || el.id?.toString() === electionId?.toString()
  );
};

/**
 * Filters elections by status
 * @param {Array} elections - Elections array
 * @param {String} status - Status to filter by
 * @returns {Array} Filtered elections
 */
export const filterElectionsByStatus = (elections = [], status) => {
  return elections.filter(el => el.status === status);
};

/**
 * Gets the next upcoming election
 * @param {Array} elections - Elections array
 * @returns {Object|undefined} Next upcoming election
 */
export const getNextUpcomingElection = (elections = []) => {
  const upcoming = filterElectionsByStatus(elections, 'upcoming');
  if (upcoming.length === 0) return undefined;
  return upcoming[0]; // Assuming they're sorted by date
};

/**
 * Gets current/ongoing elections
 * @param {Array} elections - Elections array
 * @returns {Array} Current elections
 */
export const getCurrentElections = (elections = []) => {
  return filterElectionsByStatus(elections, 'current');
};

/**
 * Sorts elections by date
 * @param {Array} elections - Elections array
 * @param {String} order - 'asc' or 'desc'
 * @returns {Array} Sorted elections
 */
export const sortElectionsByDate = (elections = [], order = 'asc') => {
  const sorted = [...elections].sort((a, b) => {
    const dateA = new Date(a.startDate || a.date);
    const dateB = new Date(b.startDate || b.date);
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
  return sorted;
};

/**
 * Groups elections by status
 * @param {Array} elections - Elections array
 * @returns {Object} Grouped elections
 */
export const groupElectionsByStatus = (elections = []) => {
  return {
    upcoming: filterElectionsByStatus(elections, 'upcoming'),
    current: filterElectionsByStatus(elections, 'current'),
    stopped: filterElectionsByStatus(elections, 'stopped'),
    completed: filterElectionsByStatus(elections, 'completed')
  };
};

/**
 * Validates election object
 * @param {Object} election - Election to validate
 * @returns {Object} { isValid: Boolean, errors: Array }
 */
export const validateElection = (election) => {
  const errors = [];

  if (!election) {
    return { isValid: false, errors: ['Election data is missing'] };
  }

  if (!election.name && !election.title) {
    errors.push('Election name is required');
  }

  if (!election.startDate && !election.date) {
    errors.push('Election start date is required');
  }

  if (!election.endDate && !election.startDate) {
    // If endDate not provided but startDate exists, it's acceptable
  }

  const validStatuses = ['upcoming', 'current', 'stopped', 'completed'];
  if (election.status && !validStatuses.includes(election.status)) {
    errors.push(`Invalid status: ${election.status}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  formatElectionData,
  mergeElectionData,
  getElectionButtonState,
  getElectionCardStyle,
  electionsAreEqual,
  findElectionById,
  filterElectionsByStatus,
  getNextUpcomingElection,
  getCurrentElections,
  sortElectionsByDate,
  groupElectionsByStatus,
  validateElection
};
