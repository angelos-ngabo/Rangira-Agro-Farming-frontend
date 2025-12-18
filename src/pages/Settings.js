import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Sidebar from '../components/layout/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import {
  Lock,
  User,
  Mail,
  Bell,
  Shield,
  Key,
  Camera,
  ArrowRight,
  Settings as SettingsIcon,
  Moon,
  Sun
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dataService } from '../services/dataService';
import toast from 'react-hot-toast';
import './Page.css';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  

  const { data: fullUser, isLoading: userLoading } = useQuery(
    ['fullUser', user?.id],
    () => dataService.getUserById(user.id).then(res => res.data),
    {
      enabled: !!user?.id,
    }
  );

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (fullUser) {
      setNotificationsEnabled(fullUser.notificationsEnabled !== false);
      setTwoFactorEnabled(fullUser.twoFactorEnabled === true);
    }
  }, [fullUser]);

  const updateNotificationMutation = useMutation(
    (enabled) => dataService.updateNotificationPreference(enabled),
    {
      onSuccess: () => {
        toast.success('Notification preference updated successfully');
        queryClient.invalidateQueries(['fullUser', user?.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update notification preference');
        setNotificationsEnabled(!notificationsEnabled); 

      }
    }
  );

  const updateTwoFactorMutation = useMutation(
    (enabled) => dataService.updateTwoFactorPreference(enabled),
    {
      onSuccess: () => {
        toast.success('Two-factor authentication preference updated successfully');
        queryClient.invalidateQueries(['fullUser', user?.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update two-factor authentication preference');
        setTwoFactorEnabled(!twoFactorEnabled); 

      }
    }
  );

  const handleNotificationToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    updateNotificationMutation.mutate(newValue);
  };

  const handleTwoFactorToggle = () => {
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);
    updateTwoFactorMutation.mutate(newValue);
  };

  const settingsSections = [
    {
      title: 'Account',
      icon: User,
      items: [
        {
          label: 'Profile Information',
          description: 'Update your personal information and profile picture',
          icon: User,
          action: () => navigate('/profile'),
          color: '#3b82f6'
        },
        {
          label: 'Change Password',
          description: 'Update your account password',
          icon: Lock,
          action: () => navigate('/dashboard/reset-password'),
          color: '#ef4444'
        },

      ]
    },
    {
      title: 'Security',
      icon: Shield,
      items: []
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: []
    },
    {
      title: 'Appearance',
      icon: Sun,
      items: []
    }
  ];
  return (
    <div className="page">
      <Sidebar />
      <div className="page-container">
        <div className="settings-container">
          <DashboardHeader />

          <div className="settings-content">
            {settingsSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="settings-section">
                <div className="settings-section-header">
                  <section.icon size={20} className="settings-section-icon" />
                  <h2 className="settings-section-title">{section.title}</h2>
                </div>

                <div className="settings-items">
                  {section.title === 'Security' && (
                    <div className="settings-item" style={{ cursor: 'default' }}>
                      <div className="settings-item-icon-wrapper" style={{ background: '#2ea35920' }}>
                        <Shield size={20} style={{ color: '#2ea359' }} />
                      </div>
                      <div className="settings-item-content" style={{ flex: 1 }}>
                        <h3 className="settings-item-label">Two-Factor Authentication</h3>
                        <p className="settings-item-description">
                          {twoFactorEnabled
                            ? '2FA is enabled. You will be required to enter a code when logging in.'
                            : '2FA is disabled. You can login without a verification code.'}
                        </p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={twoFactorEnabled}
                          onChange={handleTwoFactorToggle}
                          disabled={updateTwoFactorMutation.isLoading || userLoading}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  )}
                  {section.title === 'Notifications' && (
                    <div className="settings-item" style={{ cursor: 'default' }}>
                      <div className="settings-item-icon-wrapper" style={{ background: '#8b5cf620' }}>
                        <Bell size={20} style={{ color: '#8b5cf6' }} />
                      </div>
                      <div className="settings-item-content" style={{ flex: 1 }}>
                        <h3 className="settings-item-label">Notification Preferences</h3>
                        <p className="settings-item-description">
                          {notificationsEnabled
                            ? 'Notifications are enabled. You will receive notifications for important events.'
                            : 'Notifications are disabled. You will not receive any notifications.'}
                        </p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notificationsEnabled}
                          onChange={handleNotificationToggle}
                          disabled={updateNotificationMutation.isLoading || userLoading}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  )}
                  {section.title === 'Appearance' && (
                    <div className="settings-item" style={{ cursor: 'default' }}>
                      <div className="settings-item-icon-wrapper" style={{ background: isDarkMode ? '#f59e0b20' : '#6366f120' }}>
                        {isDarkMode ? (
                          <Moon size={20} style={{ color: '#f59e0b' }} />
                        ) : (
                          <Sun size={20} style={{ color: '#6366f1' }} />
                        )}
                      </div>
                      <div className="settings-item-content" style={{ flex: 1 }}>
                        <h3 className="settings-item-label">Dark Mode</h3>
                        <p className="settings-item-description">
                          {isDarkMode
                            ? 'Dark mode is enabled. The dashboard uses a dark theme.'
                            : 'Dark mode is disabled. The dashboard uses a light theme.'}
                        </p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={isDarkMode}
                          onChange={toggleDarkMode}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  )}
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="settings-item"
                      onClick={item.action}
                    >
                      <div className="settings-item-icon-wrapper" style={{ background: `${item.color}20` }}>
                        <item.icon size={20} style={{ color: item.color }} />
                      </div>
                      <div className="settings-item-content">
                        <h3 className="settings-item-label">{item.label}</h3>
                        <p className="settings-item-description">{item.description}</p>
                      </div>
                      <ArrowRight size={20} className="settings-item-arrow" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {}
            <div className="settings-section">
              <div className="settings-section-header">
                <SettingsIcon size={20} className="settings-section-icon" />
                <h2 className="settings-section-title">Quick Actions</h2>
              </div>

              <div className="settings-items">
                <Link to="/profile" className="settings-item-link">
                  <div className="settings-item">
                    <div className="settings-item-icon-wrapper" style={{ background: '#3b82f620' }}>
                      <Camera size={20} style={{ color: '#3b82f6' }} />
                    </div>
                    <div className="settings-item-content">
                      <h3 className="settings-item-label">Update Profile Picture</h3>
                      <p className="settings-item-description">Change your profile picture</p>
                    </div>
                    <ArrowRight size={20} className="settings-item-arrow" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div >
      </div >
    </div >
  );
};

export default Settings;

