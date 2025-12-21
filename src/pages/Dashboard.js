import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to role-specific dashboard
    if (user?.userType === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (user?.userType === 'BUYER') {
      navigate('/buyer/dashboard', { replace: true });
    } else if (user?.userType === 'STOREKEEPER') {
      navigate('/storekeeper/dashboard', { replace: true });
    } else if (user?.userType === 'FARMER') {
      navigate('/farmer/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return null; // This component just redirects
};

export default Dashboard;
