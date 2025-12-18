import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import Button from '../components/common/Button';

import { Bell, Check, CheckCheck, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './Page.css';
import './Dashboard.css';

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); 


  

  const { data: notifications = [], isLoading, refetch } = useQuery(
    ['notifications', filter],
    async () => {
      try {
        const response = await dataService.getNotifications();
        const notifs = response.data || response || [];
        return Array.isArray(notifs) ? notifs : [];
      } catch (error) {
        return [];
      }
    },
    {
      refetchInterval: 10000,
      refetchOnWindowFocus: true
    }
  );

  

  const filteredNotifications = React.useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.isRead);
    if (filter === 'read') return notifications.filter(n => n.isRead);
    return notifications;
  }, [notifications, filter]);

  const markAsReadMutation = useMutation(
    (id) => dataService.markNotificationAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['unreadNotificationCount']);
        refetch();
        toast.success('Notification marked as read');
      },
      onError: () => {
        toast.error('Failed to mark notification as read');
      }
    }
  );

  const markAllAsReadMutation = useMutation(
    () => dataService.markAllNotificationsAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['unreadNotificationCount']);
        refetch();
        toast.success('All notifications marked as read');
      },
      onError: () => {
        toast.error('Failed to mark all notifications as read');
      }
    }
  );

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    if (window.confirm('Mark all notifications as read?')) {
      markAllAsReadMutation.mutate();
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
      'SYSTEM_ALERT': '⚠️',
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
      'SYSTEM_ALERT': '#f59e0b',
    };
    return colorMap[type] || '#6b7280';
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="page">
        <Sidebar />

        <div className="page-container">
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Sidebar />
      <div className="page-container">
        <DashboardHeader />

        {}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={18} style={{ color: '#666' }} />
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'danger' : 'outline'}
              size="small"
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filter === 'read' ? 'success' : 'outline'}
              size="small"
              onClick={() => setFilter('read')}
            >
              Read ({notifications.length - unreadCount})
            </Button>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="small"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isLoading}
              icon={CheckCheck}
            >
              {markAllAsReadMutation.isLoading ? 'Marking...' : 'Mark All as Read'}
            </Button>
          )}
        </div>

        {}
        {filteredNotifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #e5e7eb'
          }}>
            <Bell size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{ color: '#666', marginBottom: '8px' }}>No notifications</h3>
            <p style={{ color: '#999', fontSize: '14px' }}>
              {filter === 'unread' ? 'You have no unread notifications' :
                filter === 'read' ? 'You have no read notifications' :
                  'You have no notifications yet'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                background: notification.isRead ? '#ffffff' : '#f0f9ff',
                border: notification.isRead ? '1px solid #e5e7eb' : '2px solid #0ea5e9',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                gap: '16px',
                transition: 'all 0.2s',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => {
                if (!notification.isRead) {
                  handleMarkAsRead(notification.id);
                }
                if (notification.actionUrl) {
                  navigate(notification.actionUrl);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `${getNotificationColor(notification.type)}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {getNotificationIcon(notification.type)}
              </div>

              {}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{
                      margin: 0,
                      marginBottom: '4px',
                      fontSize: '16px',
                      fontWeight: notification.isRead ? '500' : '700',
                      color: notification.isRead ? '#333' : '#111'
                    }}>
                      {notification.title}
                    </h3>
                    <p style={{
                      margin: 0,
                      color: '#666',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="btn-icon"
                      title="Mark as read"
                      style={{
                        background: 'transparent',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      background: `${getNotificationColor(notification.type)}20`,
                      color: getNotificationColor(notification.type),
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {notification.type?.replace(/_/g, ' ')}
                    </span>
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      {formatTime(notification.createdAt || notification.created_at)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      display: 'inline-block'
                    }} />
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;



