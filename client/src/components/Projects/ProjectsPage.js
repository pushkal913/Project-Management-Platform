import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../Common/LoadingScreen';
import Login from '../Auth/Login';
import AppLayout from '../Layout/AppLayout';
import Dashboard from '../Dashboard/Dashboard'; // TEST: Use Dashboard component

const ProjectsPage = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Loading application..." />;
  }
  
  if (!user) {
    return <Login />;
  }
  
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
};

export default ProjectsPage;
