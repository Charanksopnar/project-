import React, { useEffect, useState, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import './PushNotification.css';

const PushNotification = React.memo(() => {
  const { pushNotification } = useNotification();
  const [isVisible, setIsVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Notification type to icon mapping
  const getIcon = useCallback((type) => {
    const icons = {
      election_update: '📅',
      candidate_created: '✨',
      candidate_deleted: '🗑️',
      candidate_edited: '✏️',
      invalid_voter: '⚠️',
      new_election: '🗳️',
      result_update: '📊',
      rule_violation: '🚨',
      vote_submitted: '✅',
      verification_failed: '❌',
    };
    return icons[type] || '🔔';
  }, []);

  // Notification type to color mapping
  const getColor = useCallback((type) => {
    const colors = {
      election_update: '#3498db',
      candidate_created: '#2ecc71',
      candidate_deleted: '#e74c3c',
      candidate_edited: '#f39c12',
      invalid_voter: '#f39c12',
      new_election: '#9b59b6',
      result_update: '#1abc9c',
      rule_violation: '#c0392b',
      vote_submitted: '#27ae60',
      verification_failed: '#e67e22',
    };
    return colors[type] || '#34495e';
  }, []);

  // Handle notification visibility and auto-hide
  useEffect(() => {
    if (pushNotification) {
      setFadeOut(false);
      setIsVisible(true);

      // Auto-hide after 5 seconds
      const hideTimer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 300); // Wait for fade out animation
      }, 5000);

      return () => clearTimeout(hideTimer);
    }
  }, [pushNotification]);

  // Handle manual close
  const handleClose = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  }, []);

  if (!isVisible || !pushNotification) return null;

  return (
    <div
      className={`push-notification ${fadeOut ? 'fade-out' : 'fade-in'}`}
      style={{ borderTopColor: getColor(pushNotification.type) }}
      role="alert"
      aria-live="polite"
      aria-label={`Notification: ${pushNotification.title}`}
    >
      <div className="push-notification-icon" aria-hidden="true">
        {getIcon(pushNotification.type)}
      </div>
      <div className="push-notification-content">
        <h4 className="push-notification-title">{pushNotification.title}</h4>
        <p className="push-notification-message">{pushNotification.message}</p>
      </div>
      <button
        className="push-notification-close"
        onClick={handleClose}
        aria-label="Close notification"
        title="Close notification"
      >
        ✕
      </button>
      <div className="push-notification-progress"></div>
    </div>
  );
});

PushNotification.displayName = 'PushNotification';

export default PushNotification;
