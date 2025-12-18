import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import DashboardGlobalSearch from '../search/DashboardGlobalSearch';
import './DashboardHeader.css';

const DashboardHeader = ({ title = "Dashboard", subtitle }) => {
    const { user } = useAuth();

    return (
        <div className="dashboard-header">
            <div className="header-left">
                <h1>{title}</h1>
                <p>{subtitle || `Welcome back, ${user?.firstName || 'User'}!`}</p>
            </div>
            <div className="header-right">
                <DashboardGlobalSearch />
                <NotificationBell />
            </div>
        </div>
    );
};

export default DashboardHeader;
