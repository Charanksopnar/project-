import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { BASE_URL } from '../helper';

// Create the context
const RealtimeContext = createContext(null);

// Provider component
export const RealtimeProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [votersData, setVotersData] = useState([]);
  const [candidatesData, setCandidatesData] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [voteUpdates, setVoteUpdates] = useState(null);
  const [electionResults, setElectionResults] = useState(null);
  const [electionsData, setElectionsData] = useState([]);
  const [electionUpdate, setElectionUpdate] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    // Extract protocol and host from BASE_URL
    const socketUrl = BASE_URL.includes('localhost')
      ? BASE_URL
      : BASE_URL.replace(/http(s)?:\/\//, 'wss://');

    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
    });

    // Listen for real-time events from server
    newSocket.on('votersUpdated', (data) => {
      console.log('👥 Voters updated:', data);
      setVotersData(data);
    });

    newSocket.on('candidatesUpdated', (data) => {
      console.log('🗳️ Candidates updated:', data);
      setCandidatesData(data);
    });

    newSocket.on('dashboardDataUpdated', (data) => {
      console.log('📊 Dashboard data updated:', data);
      setDashboardData(data);
    });

    newSocket.on('voteSubmitted', (data) => {
      console.log('✅ Vote submitted:', data);
      setVoteUpdates(data);
    });

    newSocket.on('electionResultsUpdated', (data) => {
      console.log('📈 Election results updated:', data);
      setElectionResults(data);
    });

    // Listen for election updates
    newSocket.on('electionsUpdated', (data) => {
      console.log('🗳️ Elections updated:', data);
      setElectionsData(data);
    });

    newSocket.on('electionCreated', (data) => {
      console.log('✨ New election created:', data);
      setElectionUpdate({ type: 'created', election: data });
      setElectionsData(prev => [...prev, data]);
    });

    newSocket.on('electionModified', (data) => {
      console.log('✏️ Election modified:', data);
      setElectionUpdate({ type: 'modified', election: data });
      setElectionsData(prev => prev.map(el => el._id === data._id ? data : el));
    });

    newSocket.on('electionStatusChanged', (data) => {
      console.log('📊 Election status changed:', data);
      setElectionUpdate({ type: 'statusChanged', election: data });
      setElectionsData(prev => prev.map(el => el._id === data._id ? data : el));
    });

    newSocket.on('electionDeleted', (data) => {
      console.log('🗑️ Election deleted:', data);
      setElectionUpdate({ type: 'deleted', electionId: data._id });
      setElectionsData(prev => prev.filter(el => el._id !== data._id));
    });

    newSocket.on('regionElectionChanged', (data) => {
      console.log('🌍 Region election changed:', data);
      setElectionUpdate({ type: 'regionChanged', election: data });
      setElectionsData(prev => prev.map(el => el._id === data._id ? data : el));
    });

    newSocket.on('candidateChanged', (data) => {
      console.log('➕ Candidate changed:', data);
      // Update candidates list if needed
      setCandidatesData(prev => {
        const exists = prev.find(c => c._id === data.candidate._id);
        if (exists) return prev.map(c => c._id === data.candidate._id ? data.candidate : c);
        return [...prev, data.candidate];
      });
      // Update election data to include new candidate reference if needed
      // (This is handled by electionsUpdated usually, but good to have specific handler)
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  // Emit functions to send events to server
  const emitVoterUpdate = useCallback((voterData) => {
    if (socket?.connected) {
      socket.emit('updateVoter', voterData);
    }
  }, [socket]);

  const emitVote = useCallback((voteData) => {
    if (socket?.connected) {
      socket.emit('submitVote', voteData);
    }
  }, [socket]);

  const emitCandidateUpdate = useCallback((candidateData) => {
    if (socket?.connected) {
      socket.emit('updateCandidate', candidateData);
    }
  }, [socket]);

  const emitElectionUpdate = useCallback((electionData) => {
    if (socket?.connected) {
      socket.emit('updateElection', electionData);
    }
  }, [socket]);

  const emitElectionCreate = useCallback((electionData) => {
    if (socket?.connected) {
      socket.emit('createElection', electionData);
    }
  }, [socket]);

  const emitElectionStatusChange = useCallback((electionId, newStatus) => {
    if (socket?.connected) {
      socket.emit('changeElectionStatus', { electionId, status: newStatus });
    }
  }, [socket]);

  const emitElectionDelete = useCallback((electionId) => {
    if (socket?.connected) {
      socket.emit('deleteElection', { electionId });
    }
  }, [socket]);

  const emitElectionRegionUpdate = useCallback((electionId, region) => {
    if (socket?.connected) {
      socket.emit('updateElectionRegion', { electionId, region });
    }
  }, [socket]);

  const emitAddCandidateToElection = useCallback((electionId, candidate) => {
    if (socket?.connected) {
      socket.emit('addCandidateToElection', { electionId, candidate });
    }
  }, [socket]);

  const requestElectionsSync = useCallback(() => {
    if (socket?.connected) {
      socket.emit('requestElectionsSync');
    }
  }, [socket]);

  // Context value
  const value = {
    socket,
    connected,
    votersData,
    candidatesData,
    dashboardData,
    voteUpdates,
    electionResults,
    electionsData,
    electionUpdate,
    emitVoterUpdate,
    emitVote,
    emitCandidateUpdate,
    emitElectionUpdate,
    emitElectionCreate,
    emitElectionStatusChange,
    emitElectionDelete,
    emitElectionRegionUpdate,
    emitAddCandidateToElection,
    requestElectionsSync,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

// Hook to use the context
export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

export default RealtimeContext;
