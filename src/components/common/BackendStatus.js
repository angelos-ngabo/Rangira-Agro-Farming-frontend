import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import './BackendStatus.css';

const BackendStatus = () => {
  const [isOnline, setIsOnline] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await api.get('/health');
        setIsOnline(response.data?.status === 'UP');
      } catch (error) {
        setIsOnline(false);
      } finally {
        setChecking(false);
      }
    };

    checkBackend();
    

    const interval = setInterval(checkBackend, 30000);

    return () => clearInterval(interval);
  }, []);

  if (checking || isOnline) {
    return null; 

  }

  return (
    <div className="backend-status-banner">
      <AlertCircle size={20} />
      <div className="backend-status-content">
        <strong>Backend Not Available</strong>
        <span>Make sure the Spring Boot server is running on {process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:8081'}</span>
      </div>
    </div>
  );
};

export default BackendStatus;




