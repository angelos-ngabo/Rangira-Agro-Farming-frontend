import React, { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardHeader from '../dashboard/DashboardHeader';
import './DashboardLayout.css';

const DashboardLayout = ({ children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-layout-root">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
      
      <Sidebar className={sidebarOpen ? 'open' : ''} />
      
      <div className="dashboard-layout-main">
        <DashboardHeader 
          title={title} 
          subtitle={subtitle} 
          onToggleSidebar={toggleSidebar} 
        />
        <main className="dashboard-layout-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
