import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import DashboardGlobalSearch from '../search/DashboardGlobalSearch';
import './DashboardHeader.css';

const DashboardHeader = ({ title = "Dashboard", subtitle, onToggleSidebar }) => {
    const { user } = useAuth();

    return (
        <div className="dashboard-header">
            <div className="header-left">
                {onToggleSidebar && (
                    <button className="sidebar-toggle-btn" onClick={onToggleSidebar} aria-label="Toggle Sidebar">
                        <Menu size={20} />
                    </button>
                )}
                <div className="header-title-group">
                    <h1>{title}</h1>
                    <p>{subtitle || `Welcome back, ${user?.firstName || 'User'}!`}</p>
                </div>
            </div>
            <div className="header-right">
                <DashboardGlobalSearch />
                <NotificationBell />
            </div>
        </div>
    );
};

export default DashboardHeader;
