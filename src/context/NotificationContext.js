import React, { createContext, useContext, useState, useCallback, useEffect, useReducer } from 'react';
import io from 'socket.io-client';

// Create the context
const NotificationContext = createContext(null);

// Socket.io connection (will be initialized lazily)
let socket = null;

const getSocketConnection = () => {
  if (!socket) {
    const socketURL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    socket = io(socketURL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
  }
  return socket;
};

// Notification types
export const NOTIFICATION_TYPES = {
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

// Notification reducer for better state management
const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return [action.payload, ...state];
    case 'MARK_AS_READ':
      return state.map((notif) =>
        notif.id === action.payload ? { ...notif, read: true } : notif
      );
    case 'MARK_ALL_AS_READ':
      return state.map((notif) => ({ ...notif, read: true }));
    case 'DELETE_NOTIFICATION':
      return state.filter((notif) => notif.id !== action.payload);
    case 'CLEAR_ALL':
      return [];
    case 'LOAD_NOTIFICATIONS':
      return action.payload;
    default:
      return state;
  }
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);
  const [pushNotification, setPushNotification] = useState(null);

  // Initialize Socket.io listener
  useEffect(() => {
    try {
      const socketConnection = getSocketConnection();
      
      // Listen for new notifications from backend
      socketConnection.on('notification', (notification) => {
        console.log('📢 Received notification from server:', notification);
        
        // Ensure timestamp is a Date object
        const notificationData = {
          ...notification,
          timestamp: notification.timestamp ? new Date(notification.timestamp) : new Date(),
        };

        // Add to history
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: notificationData,
        });

        // Show as push notification
        setPushNotification(notificationData);
      });

      return () => {
        socketConnection.off('notification');
      };
    } catch (error) {
      console.error('Failed to connect to socket.io:', error);
    }
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({
          type: 'LOAD_NOTIFICATIONS',
          payload: parsed.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp),
          })),
        });
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  }, [notifications]);

  // Add a new notification
  const addNotification = useCallback((type, title, message, data = {}) => {
    const notification = {
      id: Date.now(),
      type,
      title,
      message,
      data,
      timestamp: new Date(),
      read: false,
    };

    // Add to notification history
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: notification,
    });

    // Show push notification (temporary display)
    setPushNotification(notification);

    return notification.id;
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    dispatch({
      type: 'MARK_AS_READ',
      payload: notificationId,
    });
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    dispatch({
      type: 'MARK_ALL_AS_READ',
    });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    dispatch({
      type: 'CLEAR_ALL',
    });
  }, []);

  // Delete specific notification
  const deleteNotification = useCallback((notificationId) => {
    dispatch({
      type: 'DELETE_NOTIFICATION',
      payload: notificationId,
    });
  }, []);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter((n) => n.type === type);
  }, [notifications]);

  // Context value
  const value = {
    notifications,
    pushNotification,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    deleteNotification,
    getUnreadCount,
    getNotificationsByType,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use the context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;
