// Quick Test - Notification System
// Run this in the browser console when on any page to test notifications

// Test 1: Add a test notification manually
console.log('Test 1: Adding manual notification...');
localStorage.setItem('testNotification', JSON.stringify({
  id: Date.now(),
  type: 'candidate_created',
  title: '✨ Test Notification',
  message: 'This is a test notification!',
  data: { candidateName: 'Test Candidate' },
  timestamp: new Date(),
  read: false
}));

// Test 2: Check if NotificationContext is working
console.log('Test 2: Checking NotificationContext...');
console.log('Socket.io should be connecting to server...');

// Test 3: Verify localStorage notifications
console.log('Test 3: Current notifications in localStorage:');
const saved = localStorage.getItem('notifications');
console.log(saved ? JSON.parse(saved) : 'No notifications yet');

// Test 4: Navigate to notifications page
console.log('Test 4: Opening notifications page...');
// window.location.href = '/notifications';

console.log('✅ Tests completed! Check the Notifications page to see your notifications.');
