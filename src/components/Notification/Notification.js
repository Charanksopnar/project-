import React, { useState, useMemo, useCallback /*, useEffect */ } from 'react';
import { useNotification, NOTIFICATION_TYPES } from '../../context/NotificationContext';
import './Notification.css';

function Notification() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');


  // Memoized filtered and sorted notifications
  const processedNotifications = useMemo(() => {
    let filtered =
      filterType === 'all'
        ? notifications
        : notifications.filter((n) => n.type === filterType);

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort notifications
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortBy === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortBy === 'unread') {
        return a.read === b.read ? 0 : a.read ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [notifications, filterType, sortBy, searchTerm]);

  // Get notification icon and color based on type
  const getNotificationIcon = useCallback((type) => {
  const icons = {
    [NOTIFICATION_TYPES.ELECTION_UPDATE]: '📆',     // Standard calendar
    [NOTIFICATION_TYPES.CANDIDATE_CREATED]: '➕',    // Standard add
    [NOTIFICATION_TYPES.CANDIDATE_DELETED]: '🗑',    // Standard delete
    [NOTIFICATION_TYPES.CANDIDATE_EDITED]: '✎',     // Standard pencil (clean version)
    [NOTIFICATION_TYPES.INVALID_VOTER]: '⚠',        // Standard warning triangle
    [NOTIFICATION_TYPES.NEW_ELECTION]: '🗳',         // Standard ballot box
    [NOTIFICATION_TYPES.RESULT_UPDATE]: '📈',        // Standard growth chart
    [NOTIFICATION_TYPES.RULE_VIOLATION]: '⛔',       // Standard prohibited symbol
    [NOTIFICATION_TYPES.VOTE_SUBMITTED]: '✔',       // Standard checkmark
    [NOTIFICATION_TYPES.VERIFICATION_FAILED]: '✖',  // Standard failure cross
  };

  return icons[type] || '🔔'; // Standard bell
}, []);

  const getNotificationColor = useCallback((type) => {
    const colors = {
      [NOTIFICATION_TYPES.ELECTION_UPDATE]: '#3498db',
      [NOTIFICATION_TYPES.CANDIDATE_CREATED]: '#2ecc71',
      [NOTIFICATION_TYPES.CANDIDATE_DELETED]: '#e74c3c',
      [NOTIFICATION_TYPES.CANDIDATE_EDITED]: '#f39c12',
      [NOTIFICATION_TYPES.INVALID_VOTER]: '#f39c12',
      [NOTIFICATION_TYPES.NEW_ELECTION]: '#9b59b6',
      [NOTIFICATION_TYPES.RESULT_UPDATE]: '#1abc9c',
      [NOTIFICATION_TYPES.RULE_VIOLATION]: '#c0392b',
      [NOTIFICATION_TYPES.VOTE_SUBMITTED]: '#27ae60',
      [NOTIFICATION_TYPES.VERIFICATION_FAILED]: '#e67e22',
    };
    return colors[type] || '#34495e';
  }, []);

  // Format timestamp
  const formatTime = useCallback((timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notificationId, isRead) => {
      if (!isRead) {
        markAsRead(notificationId);
      }
    },
    [markAsRead]
  );

  // Handle delete notification
  const handleDeleteNotification = useCallback(
    (e, notificationId) => {
      e.stopPropagation();
      deleteNotification(notificationId);
    },
    [deleteNotification]
  );

  return (
    <div className="notification-container">

      <div className="notification-content">
        <div className="notification-header">
          <h1 className="notification-title"> Notifications</h1>
          <div className="notification-controls">
            <button
              className="btn-mark-all"
              onClick={markAllAsRead}
              disabled={notifications.length === 0}
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="notification-search-bar">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="notification-filters">
          <div className="filter-group">
            <label>Filter by type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Notifications</option>
              <option value={NOTIFICATION_TYPES.ELECTION_UPDATE}>Election Updates</option>
              <option value={NOTIFICATION_TYPES.CANDIDATE_CREATED}>Candidate Created</option>
              <option value={NOTIFICATION_TYPES.CANDIDATE_DELETED}>Candidate Deleted</option>
              <option value={NOTIFICATION_TYPES.CANDIDATE_EDITED}>Candidate Edited</option>
              <option value={NOTIFICATION_TYPES.INVALID_VOTER}>Invalid Voters</option>
              <option value={NOTIFICATION_TYPES.NEW_ELECTION}>New Elections</option>
              <option value={NOTIFICATION_TYPES.RESULT_UPDATE}>Result Updates</option>
              <option value={NOTIFICATION_TYPES.RULE_VIOLATION}>Rule Violations</option>
              <option value={NOTIFICATION_TYPES.VOTE_SUBMITTED}>Votes Submitted</option>
              <option value={NOTIFICATION_TYPES.VERIFICATION_FAILED}>Verification Failed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="unread">Unread First</option>
            </select>
          </div>
        </div>

        {/* Notifications Count */}
        <div className="notification-stats">
          <span className="stat-item">Total: {notifications.length}</span>
          <span className="stat-item">
            Unread: {notifications.filter((n) => !n.read).length}
          </span>
          <span className="stat-item">
            Filtered: {processedNotifications.length}
          </span>
        </div>

        {/* Notifications List */}
        <div className="notification-list">
          {processedNotifications.length === 0 ? (
            <div className="empty-state">
              <p className="empty-message">
                {searchTerm
                  ? 'No notifications match your search'
                  : 'No notifications yet'}
              </p>
              <p className="empty-subtext">
                {searchTerm
                  ? 'Try a different search term'
                  : "You'll receive notifications for important events"}
              </p>
            </div>
          ) : (
            processedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleNotificationClick}
                onDelete={handleDeleteNotification}
                getIcon={getNotificationIcon}
                getColor={getNotificationColor}
                formatTime={formatTime}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Separate NotificationItem component for better performance
const NotificationItem = React.memo(
  ({
    notification,
    onRead,
    onDelete,
    getIcon,
    getColor,
    formatTime,
  }) => {
    const data = notification.data || {};
    const hasData = Object.keys(data).length > 0;

    return (
      <div
        className={`notification-item ${!notification.read ? 'unread' : 'read'}`}
        style={{
          borderLeftColor: getColor(notification.type),
        }}
        onClick={() => onRead(notification.id, notification.read)}
        role="article"
        aria-label={`Notification: ${notification.title}`}
      >
        <div className="notification-item-header">
          <div className="notification-icon-title">
            <span className="notification-icon" aria-hidden="true">
              {getIcon(notification.type)}
            </span>
            <div className="notification-text">
              <h3 className="notification-item-title">{notification.title}</h3>
              <p className="notification-item-message">{notification.message}</p>
            </div>
          </div>
          <div className="notification-item-actions">
            <span className="notification-time">
              {formatTime(notification.timestamp)}
            </span>
            {!notification.read && <span className="unread-badge">NEW</span>}
            <button
              className="btn-delete"
              onClick={(e) => onDelete(e, notification.id)}
              title="Delete notification"
              aria-label={`Delete notification: ${notification.title}`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Additional data */}
        {hasData && (
          <div className="notification-data">
            {data.electionName && (
              <p>
                <strong>Election:</strong> {data.electionName}
              </p>
            )}
            {data.candidateName && (
              <p>
                <strong>Candidate:</strong> {data.candidateName}
              </p>
            )}
            {data.voterEmail && (
              <p>
                <strong>Voter:</strong> {data.voterEmail}
              </p>
            )}
            {data.reason && (
              <p>
                <strong>Reason:</strong> {data.reason}
              </p>
            )}
            {data.time && (
              <p>
                <strong>Time:</strong> {data.time}
              </p>
            )}
            {data.details && (
              <p>
                <strong>Details:</strong> {data.details}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default Notification;
