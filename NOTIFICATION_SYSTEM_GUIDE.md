# Notification System Implementation Guide

## ✅ Features Implemented

### 1. **Notification Page** (`/notifications`)
- View all notification history
- Filter by notification type
- Sort by newest/oldest/unread
- Search notifications by title/message
- Mark single or all notifications as read
- Delete individual notifications
- Real-time unread count display

### 2. **Top Bar Notification Icon** 
- **User Navbar**: Shows bell icon with unread badge
- **Admin Navbar**: Shows bell icon with unread badge
- **Admin Sidebar**: Shows "Notifications" menu item with badge
- Click icon/link to navigate to `/notifications` page

### 3. **Push Notifications**
- Auto-hide toast notifications appear on any page
- Display for 5 seconds then fade out
- Color-coded by notification type
- Emoji icons for visual distinction

### 4. **Backend Notification Triggers**

#### Candidate Operations
- ✨ **Candidate Created**: Triggered when new candidate added
- 🗑️ **Candidate Deleted**: Triggered when candidate removed
- ✏️ **Candidate Edited**: Can be added to candidate update endpoint

#### Election Operations
- 🗳️ **New Election Created**: Triggered when election created
- 📅 **Election Started/Updated**: Triggered when election status changes
- 📊 **Results Updated**: Can be triggered when results finalized

#### Voter Operations
- ✅ **Vote Submitted**: Triggered when voter successfully votes
- 🚨 **Rule Violation**: Triggered when voter edits profile >2 times
- ⚠️ **Invalid Voters**: Can be added to voter verification checks

### 5. **Notification Types**
```javascript
- election_update: Election start/end/status changes
- candidate_created: New candidate added
- candidate_deleted: Candidate removed
- candidate_edited: Candidate details modified
- invalid_voter: Voter fails verification
- new_election: Election created
- result_update: Election results published
- rule_violation: User violates rules (excessive profile edits)
- vote_submitted: Vote successfully recorded
- verification_failed: Biometric/ID verification failed
```

## 🏗️ Architecture

### Frontend Flow
```
User Action (click bell icon/navbar link)
    ↓
Navigate to /notifications (Notification component)
    ↓
NotificationContext manages:
  - notifications array (history)
  - pushNotification object (current toast)
  - Socket.io listener for 'notification' events
    ↓
Notifications displayed with filtering/sorting
PushNotification component shows toast on any page
```

### Backend Flow
```
Admin/User Action (create candidate, election, vote, etc.)
    ↓
Route handler processes request
    ↓
Emit notification via io.emit('notification', {...})
    ↓
Socket.io broadcasts to all connected clients
    ↓
Frontend receives via Socket.io listener
    ↓
NotificationContext dispatch ADD_NOTIFICATION
    ↓
Saved to localStorage + displayed as push notification
```

## 📁 Files Modified/Created

### Frontend
- ✅ `src/components/Notification/Notification.js` - Main notification page
- ✅ `src/components/Notification/Notification.css` - Notification page styles
- ✅ `src/components/Notification/PushNotification.js` - Toast notification component
- ✅ `src/components/Notification/PushNotification.css` - Toast styles
- ✅ `src/context/NotificationContext.js` - Context + Socket.io listener
- ✅ `src/components/Navbar/UserNavbar.js` - Added notification icon
- ✅ `src/components/Navbar/AdminNav.js` - Added notification icon
- ✅ `src/components/NewDashboard/scenes/global/Sidebar.jsx` - Added notifications menu
- ✅ `src/App.js` - NotificationProvider wrapper

### Backend
- ✅ `server/utils/notificationEmitter.js` - Notification service
- ✅ `server/routes/candidateRoutes.js` - Candidate notifications
- ✅ `server/routes/voterRoutes.js` - Voter profile edit tracking + rule violations
- ✅ `server/server.js` - Election + vote notifications + candidate creation
- ✅ `server/models/Voter.js` - Added `profileEditCount` field

## 🔌 Socket.io Events

### Frontend Listens To
```javascript
socket.on('notification', (notification) => {
  // Adds to notifications array
  // Shows as push notification
})
```

### Backend Emits
```javascript
io.emit('notification', {
  id: Date.now(),
  type: 'notification_type',
  title: 'Title',
  message: 'Message text',
  data: { /* contextual data */ },
  timestamp: new Date(),
  read: false
})
```

## 🚀 How to Use

### For Admin
1. Click bell icon in AdminNav → See all notifications
2. Notifications appear automatically when:
   - New election created
   - Candidate added/deleted
   - Voter attempts excessive profile edits
   - Vote submitted

### For User
1. Click bell icon in UserNavbar → See all notifications
2. View notifications for:
   - Election status updates
   - Vote confirmation
   - Any rule violations

### For Developer - Adding New Notification
```javascript
// In any route/socket handler:
io.emit('notification', {
  id: Date.now(),
  type: 'your_type',
  title: '🔔 Your Title',
  message: 'Your message',
  data: { customData: 'value' },
  timestamp: new Date(),
  read: false
});
```

## 📊 Rule Violation Logic

### Profile Edit Tracking
- Each voter has `profileEditCount` in database
- Increments by 1 each time profile is updated
- When count > 2, notification emitted with type `rule_violation`
- Admin can see which voters have excessive edits

### Example Flow
1. Voter edits profile → count = 1 (no alert)
2. Voter edits profile again → count = 2 (no alert)
3. Voter edits profile 3rd time → count = 3 → 🚨 NOTIFICATION SENT

## 🔒 Data Persistence

- Notifications saved to localStorage
- Loaded on app startup
- Synced across page navigations
- Survives browser refresh (while localStorage intact)

## 🐛 Testing

### Test Candidate Notification
```bash
POST /createCandidate
{
  "firstName": "John",
  "party": "ABC",
  "age": "45",
  "bio": "Test"
}
```

### Test Election Notification
```bash
POST /createElection
{
  "name": "Presidential 2024",
  "startDate": "2024-12-01T00:00:00Z",
  "endDate": "2024-12-02T00:00:00Z"
}
```

### Test Rule Violation
```bash
PATCH /voter/:id/updateVoter (3x)
```

## ⚙️ Configuration

### Socket.io URL
Edit in `NotificationContext.js`:
```javascript
const socketURL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
```

Set `.env`:
```
REACT_APP_SOCKET_URL=http://your-server:5000
```

## ✨ Future Enhancements

- [ ] Email notifications integration
- [ ] SMS notifications for critical alerts
- [ ] Notification preferences/settings
- [ ] Notification categories/muting
- [ ] Database persistence for notifications
- [ ] Notification analytics/reporting
- [ ] Scheduled notifications for election reminders
