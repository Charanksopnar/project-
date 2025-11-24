# Notification System Integration Guide

This document explains how to integrate the notification system throughout the application for real-time updates.

## System Overview

The notification system consists of:

1. **Frontend Components** (React)
   - `NotificationContext` - Global state management for notifications
   - `Notification.js` - Notification page showing history
   - `PushNotification.js` - Toast-style real-time notifications

2. **Backend Service** (Node.js + Socket.io)
   - `notificationService.js` - Notification emission and management
   - Socket.io connection for real-time communication

## Architecture Flow

```
User Action → Backend Route → notificationService.sendNotification()
                                ↓
                          Socket.io emit
                                ↓
                        Frontend Socket Listener
                                ↓
                    NotificationContext.addNotification()
                                ↓
                    Push Toast + History Storage
```

## Setup Instructions

### 1. Initialize Socket.io in Server (server.js)

```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const { initializeNotificationService } = require('./utils/notificationService');

// Initialize notification service
initializeNotificationService(io);

// Handle socket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join room based on user role
  socket.on('join', (userData) => {
    const { userId, role } = userData;
    socket.join(userId); // Join user-specific room
    if (role === 'admin') {
      socket.join('admin'); // Join admin room
    } else if (role === 'user') {
      socket.join('user'); // Join user room
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
```

### 2. Setup Socket Connection in Frontend (src/App.js or context)

Create a custom hook for socket connection:

```javascript
// hooks/useSocket.js
import { useEffect } from 'react';
import io from 'socket.io-client';
import { useNotification } from '../context/NotificationContext';

const useSocket = () => {
  const { addNotification } = useNotification();

  useEffect(() => {
    const socket = io('http://localhost:5000');

    // Emit join event with user data
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    socket.emit('join', { userId, role: userRole });

    // Listen for notifications
    socket.on('notification', (notification) => {
      addNotification(
        notification.type,
        notification.title,
        notification.message,
        notification.data
      );
    });

    return () => socket.disconnect();
  }, [addNotification]);
};

export default useSocket;
```

Use in App.js:
```javascript
import useSocket from './hooks/useSocket';

function App() {
  useSocket(); // Initialize socket connection
  // ... rest of app
}
```

## Notification Usage Examples

### Election Routes (server/routes/electionRoutes.js)

```javascript
const { notifyElectionCreated, notifyElectionUpdate, notifyElectionStarted, notifyElectionEnded } = require('../utils/notificationService');

// Create election
router.post('/create', async (req, res) => {
  try {
    const election = new Election(req.body);
    await election.save();
    
    // Send notification
    notifyElectionCreated(
      election.name,
      election.startDate,
      election.endDate
    );
    
    res.json({ success: true, election });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update election
router.put('/update/:id', async (req, res) => {
  try {
    const election = await Election.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Send notification
    notifyElectionUpdate(election.name, 'updated', req.body);
    
    res.json({ success: true, election });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Candidate Routes (server/routes/candidateRoutes.js)

```javascript
const { notifyCandidateCreated, notifyCandidateEdited, notifyCandidateDeleted } = require('../utils/notificationService');

// Create candidate
router.post('/create', async (req, res) => {
  try {
    const candidate = new Candidate(req.body);
    await candidate.save();
    
    notifyCandidateCreated(candidate.name, candidate.electionId);
    
    res.json({ success: true, candidate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit candidate
router.put('/edit/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    notifyCandidateEdited(candidate.name, candidate.electionId, req.body);
    
    res.json({ success: true, candidate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete candidate
router.delete('/delete/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    
    notifyCandidateDeleted(candidate.name, candidate.electionId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Voter & Voting Routes (server/routes/voterRoutes.js)

```javascript
const { notifyVoteSubmitted, notifyInvalidVoter, notifyVerificationFailed, notifyProfileChangedTooOften, notifyRuleViolation } = require('../utils/notificationService');

// Submit vote
router.post('/vote', async (req, res) => {
  try {
    const { voterId, candidateId, electionId } = req.body;
    
    // Process vote...
    
    notifyVoteSubmitted(voterId, 'Election Name');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark invalid voter
router.post('/mark-invalid', async (req, res) => {
  try {
    const { voterId, reason } = req.body;
    
    // Mark voter as invalid...
    
    notifyInvalidVoter(voterId, reason);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verification failed
router.post('/verification-failed', async (req, res) => {
  try {
    const { voterId, reason } = req.body;
    
    notifyVerificationFailed(voterId, reason);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile changed too often
router.post('/check-profile-changes', async (req, res) => {
  try {
    const { voterId } = req.body;
    const changeCount = await getProfileChangeCount(voterId);
    
    if (changeCount > 2) {
      notifyProfileChangedTooOften(voterId);
      return res.json({ success: false, error: 'Profile changed too many times' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Results Routes (server/routes/resultsRoutes.js)

```javascript
const { notifyResultsAvailable, notifyResultsUpdated } = require('../utils/notificationService');

// Publish results
router.post('/publish', async (req, res) => {
  try {
    const { electionId } = req.body;
    
    // Calculate and save results...
    
    notifyResultsAvailable('Election Name', resultSummary);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update results
router.put('/update/:id', async (req, res) => {
  try {
    // Update results...
    
    notifyResultsUpdated('Election Name', updateInfo);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Biometrics Routes (server/routes/biometricsRoutes.js)

```javascript
const { notifyVerificationFailed, notifyRuleViolation } = require('../utils/notificationService');

// Face verification
router.post('/verify-face', async (req, res) => {
  try {
    const verified = await faceVerification(req.body);
    
    if (!verified) {
      notifyVerificationFailed(req.body.voterId, 'Face verification failed');
      return res.json({ success: false, error: 'Verification failed' });
    }
    
    res.json({ success: true });
  } catch (error) {
    notifyVerificationFailed(req.body.voterId, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Liveness detection
router.post('/liveness-check', async (req, res) => {
  try {
    const isLive = await livenessDetection(req.body);
    
    if (!isLive) {
      notifyRuleViolation(req.body.voterId, 'Liveness check failed', 'User did not pass liveness detection');
      return res.json({ success: false, error: 'Liveness check failed' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Notification Types Reference

### Available Notification Types

```javascript
ELECTION_UPDATE      // Election started/ended/updated
CANDIDATE_CREATED    // New candidate added
CANDIDATE_DELETED    // Candidate removed
CANDIDATE_EDITED     // Candidate info updated
INVALID_VOTER        // Voter marked as invalid
NEW_ELECTION         // New election created
RESULT_UPDATE        // Results available/updated
RULE_VIOLATION       // Rule violation detected
VOTE_SUBMITTED       // Vote successfully recorded
VERIFICATION_FAILED  // Biometric verification failed
```

## Frontend Integration

### Using Notifications in Components

```javascript
import { useNotification } from '../context/NotificationContext';

function MyComponent() {
  const { addNotification } = useNotification();

  const handleAction = () => {
    // Manually add notification (if needed)
    addNotification(
      'new_election',
      '🗳️ New Election',
      'A new election has been created',
      { electionName: 'President 2024' }
    );
  };

  return <button onClick={handleAction}>Test Notification</button>;
}
```

### Accessing Notification History

```javascript
import { useNotification } from '../context/NotificationContext';

function NotificationPanel() {
  const { notifications, getUnreadCount } = useNotification();

  return (
    <div>
      <h2>Unread: {getUnreadCount()}</h2>
      <ul>
        {notifications.map(notif => (
          <li key={notif.id}>{notif.title}: {notif.message}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Best Practices

1. **Always include notification** after state changes
2. **Include relevant data** in notification.data for details
3. **Use appropriate types** for different events
4. **Target recipients** using recipientType or recipientId
5. **Test notifications** in development using browser DevTools
6. **Handle socket disconnections** gracefully
7. **Store notifications** in localStorage for persistence
8. **Clear old notifications** periodically to save storage

## Troubleshooting

### Notifications not appearing

1. Check Socket.io connection in browser console
2. Verify notificationService is initialized
3. Check user joined correct room
4. Verify recipient type matches

### Socket connection issues

1. Check CORS settings in server
2. Verify Socket.io version compatibility
3. Check firewall/proxy settings
4. Enable socket.io debugging: `io.set('log level', 1)`

## Files Modified/Created

- ✅ `src/context/NotificationContext.js` - Context and provider
- ✅ `src/components/Notification/Notification.js` - Notification page
- ✅ `src/components/Notification/PushNotification.js` - Toast notifications
- ✅ `src/components/Notification/Notification.css` - Page styles
- ✅ `src/components/Notification/PushNotification.css` - Toast styles
- ✅ `server/utils/notificationService.js` - Backend service
- ✅ `src/hooks/useSocket.js` - Socket connection hook (needs creation)
- ✅ Updated Navbar components with notification icon

## Next Steps

1. Create `src/hooks/useSocket.js` with socket connection logic
2. Update `server.js` to initialize Socket.io and notification service
3. Add notification calls to existing routes
4. Test notification flow end-to-end
5. Customize notification messages as needed
