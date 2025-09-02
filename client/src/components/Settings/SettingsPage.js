import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../Common/LoadingScreen';
import Login from '../Auth/Login';
import AppLayout from '../Layout/AppLayout';
import Settings from './Settings';
import Dashboard from '../Dashboard/Dashboard';

const SettingsPage = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Loading application..." />;
  }
  
  if (!user) {
    return <Login />;
  }
  
  // Check admin role
  if (user.role !== 'admin') {
    return (
      <AppLayout>
        <Dashboard />
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <Settings />
    </AppLayout>
  );
};

export default SettingsPage;
