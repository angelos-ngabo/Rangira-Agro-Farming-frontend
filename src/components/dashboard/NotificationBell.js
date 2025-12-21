import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { dataService } from '../../services/dataService';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch notifications from API
  const { data: notifications = [], refetch: refetchNotifications } = useQuery(
    ['notifications'],
    async () => {
      try {
        const response = await dataService.getNotifications();
        const notifs = response.data || response || [];
        console.log('Fetched notifications:', notifs);
        return Array.isArray(notifs) ? notifs : [];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    {
      refetchInterval: 10000, // Refresh every 10 seconds for better responsiveness
      refetchOnWindowFocus: true,
      retry: 3,
      staleTime: 5000 // Consider data stale after 5 seconds
    }
  );

  // Fetch unread count
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery(
    ['unreadNotificationCount'],
    async () => {
      try {
        const response = await dataService.getUnreadNotificationCount();
        const count = response.data || response || 0;
        console.log('Unread notification count:', count);
        return typeof count === 'number' ? count : 0;
      } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }
    },
    {
      refetchInterval: 10000, // Refresh every 10 seconds
      refetchOnWindowFocus: true,
      retry: 3,
      staleTime: 5000
    }
  );

  const markAsReadMutation = useMutation(
    (id) => dataService.markNotificationAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['unreadNotificationCount']);
        // Also manually refetch to ensure UI updates immediately
        refetchNotifications();
        refetchUnreadCount();
      },
    }
  );

  const markAllAsReadMutation = useMutation(
    () => dataService.markAllNotificationsAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['unreadNotificationCount']);
        // Also manually refetch to ensure UI updates immediately
        refetchNotifications();
        refetchUnreadCount();
      },
    }
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleClearAll = () => {
    if (window.confirm('Mark all notifications as read?')) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const now = new Date();
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Just now';
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Just now';
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'ORDER_SHIPPED': '🚚',
      'ORDER_DELIVERED': '✅',
      'PAYMENT_RECEIVED': '💰',
      'ORDER_CONFIRMED': '📦',
      'ENQUIRY_RECEIVED': '📧',
      'ENQUIRY_ACCEPTED': '✓',
      'ENQUIRY_REJECTED': '✗',
      'SHIPMENT_REQUEST': '📦',
      'WAREHOUSE_ACCESS_APPROVED': '✓',
      'WAREHOUSE_ACCESS_REJECTED': '✗',
      'WAREHOUSE_ACCESS_SUBMITTED': '📋',
      'SYSTEM_ALERT': '⚠️',
      'USER_CREATED': '👤',
      'USER_UPDATED': '✏️',
      'USER_DELETED': '🗑️',
      'WAREHOUSE_CREATED': '🏢',
      'WAREHOUSE_UPDATED': '✏️',
      'WAREHOUSE_DELETED': '🗑️',
      'INVENTORY_CREATED': '📦',
      'INVENTORY_UPDATED': '✏️',
      'INVENTORY_DELETED': '🗑️',
      'CROP_TYPE_CREATED': '🌾',
      'CROP_TYPE_UPDATED': '✏️',
      'CROP_TYPE_DELETED': '🗑️',
    };
    return iconMap[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      'ORDER_SHIPPED': '#06b6d4',
      'ORDER_DELIVERED': '#2ea359',
      'PAYMENT_RECEIVED': '#2ea359',
      'ORDER_CONFIRMED': '#3b82f6',
      'ENQUIRY_RECEIVED': '#3b82f6',
      'ENQUIRY_ACCEPTED': '#2ea359',
      'ENQUIRY_REJECTED': '#ef4444',
      'SHIPMENT_REQUEST': '#f59e0b',
      'WAREHOUSE_ACCESS_APPROVED': '#2ea359',
      'WAREHOUSE_ACCESS_REJECTED': '#ef4444',
      'WAREHOUSE_ACCESS_SUBMITTED': '#3b82f6',
      'SYSTEM_ALERT': '#f59e0b',
      'USER_CREATED': '#3b82f6',
      'USER_UPDATED': '#06b6d4',
      'USER_DELETED': '#ef4444',
      'WAREHOUSE_CREATED': '#3b82f6',
      'WAREHOUSE_UPDATED': '#06b6d4',
      'WAREHOUSE_DELETED': '#ef4444',
      'INVENTORY_CREATED': '#3b82f6',
      'INVENTORY_UPDATED': '#06b6d4',
      'INVENTORY_DELETED': '#ef4444',
      'CROP_TYPE_CREATED': '#2ea359',
      'CROP_TYPE_UPDATED': '#06b6d4',
      'CROP_TYPE_DELETED': '#ef4444',
    };
    return colorMap[type] || '#6b7280';
  };

  const getNotificationTypeClass = (type) => {
    const typeMap = {
      'ORDER_SHIPPED': 'info',
      'ORDER_DELIVERED': 'success',
      'WAREHOUSE_ACCESS_SUBMITTED': 'info',
      'WAREHOUSE_ACCESS_APPROVED': 'success',
      'WAREHOUSE_ACCESS_REJECTED': 'error',
      'ENQUIRY_RECEIVED': 'info',
      'ENQUIRY_ACCEPTED': 'success',
      'ENQUIRY_REJECTED': 'error',
      'PAYMENT_RECEIVED': 'success',
      'ORDER_CONFIRMED': 'info',
      'SHIPMENT_REQUEST': 'warning',
      'SYSTEM_ALERT': 'info',
      'USER_CREATED': 'info',
      'USER_UPDATED': 'info',
      'USER_DELETED': 'error',
      'WAREHOUSE_CREATED': 'info',
      'WAREHOUSE_UPDATED': 'info',
      'WAREHOUSE_DELETED': 'error',
      'INVENTORY_CREATED': 'info',
      'INVENTORY_UPDATED': 'info',
      'INVENTORY_DELETED': 'error',
      'CROP_TYPE_CREATED': 'info',
      'CROP_TYPE_UPDATED': 'info',
      'CROP_TYPE_DELETED': 'error',
    };
    return typeMap[type] || 'info';
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button
                className="clear-all-button"
                onClick={handleClearAll}
                title="Clear all"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <Bell size={32} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="notification-content">
                    <div className="notification-title-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '18px' }}>
                          {getNotificationIcon(notification.type)}
                        </span>
                        <h4>{notification.title}</h4>
                      </div>
                      {!notification.isRead && (
                        <button
                          className="mark-read-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                    <p>{notification.message}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span className="notification-time">
                        {formatTime(notification.createdAt || notification.created_at)}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: `${getNotificationColor(notification.type)}20`,
                        color: getNotificationColor(notification.type),
                        fontWeight: '600'
                      }}>
                        {notification.type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <div className={`notification-indicator ${getNotificationTypeClass(notification.type)}`} />
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="view-all-link"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#116530',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: 0,
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

