# Real-Time Election Update - Developer Integration Guide

## 🛠️ For Developers: How to Use & Extend

### Quick Integration for New Components

#### Step 1: Import the Hook
```javascript
import { useRealtime } from '@/context/RealtimeContext';
```

#### Step 2: Use the Hook
```javascript
const MyComponent = () => {
  const { 
    electionsData,           // Current elections array
    electionUpdate,          // Last election update
    emitElectionStatusChange, // Change status
    emitElectionDelete,      // Delete election
    connected                // Socket connection status
  } = useRealtime();

  return (
    // Your component JSX
  );
};
```

#### Step 3: Listen to Changes
```javascript
useEffect(() => {
  if (electionsData) {
    // Do something when elections change
    console.log('Elections updated:', electionsData);
  }
}, [electionsData]);
```

---

## 🎯 Common Use Cases

### Use Case 1: Display Current Elections
```javascript
const ElectionList = () => {
  const { electionsData, requestElectionsSync } = useRealtime();
  const [elections, setElections] = useState([]);

  useEffect(() => {
    requestElectionsSync(); // Initial sync
  }, [requestElectionsSync]);

  useEffect(() => {
    if (electionsData?.length > 0) {
      setElections(electionsData);
    }
  }, [electionsData]); // Update when data changes

  return (
    <ul>
      {elections.map(election => (
        <li key={election._id}>{election.name}</li>
      ))}
    </ul>
  );
};
```

### Use Case 2: Admin Controls
```javascript
const AdminControls = ({ electionId }) => {
  const { emitElectionStatusChange, emitElectionDelete } = useRealtime();

  const handleStart = () => {
    emitElectionStatusChange(electionId, 'current');
    // All users instantly see button change! ✨
  };

  const handleStop = () => {
    emitElectionStatusChange(electionId, 'stopped');
  };

  const handleDelete = () => {
    emitElectionDelete(electionId);
    // Election disappears from all screens!
  };

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};
```

### Use Case 3: User Voting Interface
```javascript
const VotingInterface = ({ electionId, voteStatus }) => {
  const { electionsData } = useRealtime();
  const [election, setElection] = useState(null);

  useEffect(() => {
    const found = electionsData?.find(el => 
      el._id?.toString() === electionId || el.id === electionId
    );
    setElection(found);
  }, [electionsData, electionId]);

  if (!election) return <div>Loading...</div>;

  const canVote = election.status === 'current' && !voteStatus;

  return (
    <div>
      <h2>{election.name}</h2>
      <p>Status: {election.status}</p>
      <button disabled={!canVote}>
        {canVote ? 'Vote Now' : 'Not Available'}
      </button>
    </div>
  );
};
```

### Use Case 4: Real-Time Monitoring Dashboard
```javascript
const MonitoringDashboard = () => {
  const { 
    electionsData, 
    electionUpdate, 
    connected 
  } = useRealtime();

  return (
    <div>
      <div>
        Connection: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      <div>
        Total Elections: {electionsData?.length || 0}
      </div>

      <div>
        {electionUpdate && (
          <p>Latest Update: {electionUpdate.type} - {new Date().toLocaleTimeString()}</p>
        )}
      </div>

      <div>
        {electionsData?.map(election => (
          <div key={election._id}>
            {election.name}: {election.status}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔄 Event Flow Patterns

### Pattern 1: Simple Status Change
```
User clicks button
       ↓
emitElectionStatusChange(id, newStatus)
       ↓
Socket sends to server
       ↓
Server validates & updates mockDb
       ↓
io.emit('electionStatusChanged', data)
       ↓
RealtimeContext receives event
       ↓
electionsData state updates
       ↓
Component re-renders
       ↓
UI reflects new status ✨
```

### Pattern 2: Create + Broadcast
```
Admin submits form
       ↓
REST API POST /createElection
       ↓
Server creates election + emits events
       ↓
io.emit('electionCreated', newElection)
io.emit('electionsUpdated', allElections)
       ↓
All clients receive update
       ↓
New election appears everywhere ✨
```

### Pattern 3: Delete + Cleanup
```
Admin clicks delete
       ↓
Confirmation dialog
       ↓
emitElectionDelete(electionId)
       ↓
Server removes from mockDb
       ↓
io.emit('electionDeleted', deletedElection)
       ↓
Client filters out deleted election
       ↓
Removed from all screens ✨
```

---

## 🧪 Testing Real-Time Updates

### Test Setup
```javascript
// Open browser DevTools console

// 1. Check connection status
console.log(socket.connected);

// 2. Listen for events
socket.on('electionCreated', (data) => {
  console.log('Election created:', data);
});

socket.on('electionStatusChanged', (data) => {
  console.log('Status changed:', data);
});

// 3. Manually emit test event
socket.emit('changeElectionStatus', {
  electionId: '1',
  status: 'current'
});
```

### Test Across Tabs
```javascript
// Open same application in 2 tabs
// Tab A: Admin Dashboard
// Tab B: User Dashboard

// In Tab A: Click "Start Election" button
// In Tab B: Watch button change to "Participate/Vote" instantly! ✨
```

### Simulate Network Issues
```javascript
// In browser DevTools → Network tab

// Throttle to "Slow 3G"
// Make admin change
// Watch automatic reconnection and recovery

// Close browser DevTools Network tab to resume
```

---

## 🛡️ Error Handling

### Safe Hook Usage
```javascript
const SafeComponent = () => {
  const realtimeContext = useRealtime();
  
  if (!realtimeContext) {
    return <div>Real-time connection unavailable</div>;
  }

  const { electionsData = [], connected } = realtimeContext;

  return (
    <div>
      Status: {connected ? 'Connected' : 'Connecting...'}
      Elections: {electionsData.length}
    </div>
  );
};
```

### Error Handling for Emit
```javascript
const handleStatusChange = async (electionId, newStatus) => {
  try {
    const { emitElectionStatusChange } = useRealtime();
    
    if (!emitElectionStatusChange) {
      throw new Error('Real-time connection not available');
    }

    emitElectionStatusChange(electionId, newStatus);
    
    // Show success feedback
    showNotification(`Election status changed to ${newStatus}`);
  } catch (error) {
    console.error('Error changing election status:', error);
    showError('Failed to update election status');
  }
};
```

---

## 🎨 UI Patterns

### Pattern 1: Dynamic Button
```javascript
const ElectionButton = ({ election, voteStatus }) => {
  const getButtonState = (election, voteStatus) => {
    if (voteStatus) return { text: 'Already Voted', disabled: true };
    if (election.status === 'upcoming') return { text: 'Not Available', disabled: true };
    if (election.status === 'current') return { text: 'Participate/Vote', disabled: false };
    return { text: 'Ended', disabled: true };
  };

  const { text, disabled } = getButtonState(election, voteStatus);

  return (
    <button disabled={disabled}>
      {text}
    </button>
  );
};
```

### Pattern 2: Status Badge
```javascript
const StatusBadge = ({ status }) => {
  const badgeStyles = {
    upcoming: { bg: 'blue', text: 'Upcoming' },
    current: { bg: 'green', text: 'Active' },
    stopped: { bg: 'gray', text: 'Stopped' },
    completed: { bg: 'darkgreen', text: 'Completed' }
  };

  const style = badgeStyles[status] || badgeStyles.upcoming;

  return (
    <span style={{ backgroundColor: style.bg, color: 'white', padding: '4px 8px' }}>
      {style.text}
    </span>
  );
};
```

### Pattern 3: Real-Time Indicator
```javascript
const ConnectionIndicator = () => {
  const { connected } = useRealtime();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: connected ? '#2ecc71' : '#e74c3c',
        animation: connected ? 'pulse 2s infinite' : 'none'
      }} />
      <span>{connected ? 'Connected' : 'Reconnecting...'}</span>
    </div>
  );
};
```

---

## 📚 Utility Functions Usage

### Import Utilities
```javascript
import {
  formatElectionData,
  getElectionButtonState,
  filterElectionsByStatus,
  getCurrentElections,
  sortElectionsByDate,
  validateElection
} from '@/utils/electionSync';
```

### Format Data
```javascript
const formattedElection = formatElectionData(rawBackendElection);
// Converts backend format to frontend format
```

### Get Button State
```javascript
const { buttonText, isEnabled, backgroundColor } = 
  getElectionButtonState(election, userHasVoted);

// Use in component
<button 
  disabled={!isEnabled}
  style={{ backgroundColor }}
>
  {buttonText}
</button>
```

### Filter Elections
```javascript
const currentElections = getCurrentElections(electionsData);
const upcoming = filterElectionsByStatus(electionsData, 'upcoming');
const sortedByDate = sortElectionsByDate(electionsData, 'asc');
```

### Validate Data
```javascript
const { isValid, errors } = validateElection(newElection);
if (!isValid) {
  console.error('Validation errors:', errors);
  showErrors(errors);
}
```

---

## 🔒 Security Considerations

### Always Validate on Client
```javascript
const safelyEmitStatusChange = (electionId, newStatus) => {
  // Validate status
  const validStatuses = ['upcoming', 'current', 'stopped', 'completed'];
  if (!validStatuses.includes(newStatus)) {
    console.error('Invalid status:', newStatus);
    return;
  }

  // Validate electionId
  if (!electionId || typeof electionId !== 'string') {
    console.error('Invalid election ID');
    return;
  }

  emitElectionStatusChange(electionId, newStatus);
};
```

### Authentication Check
```javascript
// Ensure user is admin before allowing changes
const AdminOnlyControl = ({ electionId }) => {
  const { user } = useAuth();
  const { emitElectionStatusChange } = useRealtime();

  if (user?.role !== 'admin') {
    return <div>Unauthorized</div>;
  }

  const handleStatusChange = (status) => {
    emitElectionStatusChange(electionId, status);
  };

  return (
    <div>
      {/* Admin controls */}
    </div>
  );
};
```

---

## 🚀 Performance Tips

### 1. Debounce Updates
```javascript
import { useEffect, useRef } from 'react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const Component = () => {
  const { electionsData } = useRealtime();
  const debouncedElections = useDebounce(electionsData, 300);

  // Use debouncedElections
};
```

### 2. Memoize Derived Values
```javascript
import { useMemo } from 'react';

const Component = () => {
  const { electionsData } = useRealtime();

  const currentElections = useMemo(() => {
    return electionsData?.filter(el => el.status === 'current') || [];
  }, [electionsData]);

  return (
    // Use currentElections
  );
};
```

### 3. Avoid Re-renders
```javascript
import { memo } from 'react';

const ElectionCard = memo(({ election, onStatusChange }) => {
  return (
    // Only re-renders if election prop changes
  );
});
```

---

## 📞 Debugging

### Enable Debug Logging
```javascript
// In RealtimeContext.js, uncomment or add:
newSocket.on('*', (event, data) => {
  console.log('Socket event:', event, data);
});
```

### Monitor State Changes
```javascript
// In component
useEffect(() => {
  console.log('Elections changed:', electionsData);
}, [electionsData]);

useEffect(() => {
  console.log('Election update:', electionUpdate);
}, [electionUpdate]);
```

### Network Inspection
1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Watch real-time messages being sent/received
4. Check message payload size and frequency

---

## 🎓 Best Practices

✅ **DO:**
- Always import useRealtime inside components
- Check connection status before critical operations
- Validate data before emitting events
- Use debouncing for frequent updates
- Handle errors gracefully
- Provide fallback UI for offline mode

❌ **DON'T:**
- Emit events without validation
- Assume electionsData is always populated
- Make direct state changes instead of using emit functions
- Ignore connection status
- Hold references to socket outside of context
- Mix REST API with Socket.IO without coordination

---

## 🔗 Related Documentation

- See `REALTIME_UPDATE_PIPELINE.md` for full architecture
- See `REALTIME_UPDATE_QUICK_START.md` for quick reference
- See `REALTIME_UPDATE_BEFORE_AFTER.md` for feature comparison
- See `src/utils/electionSync.js` for all utility functions

---

**Happy Coding!** 🚀

The real-time election system is ready to power your voting platform!
