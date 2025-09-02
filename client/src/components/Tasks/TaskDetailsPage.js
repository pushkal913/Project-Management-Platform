import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../Common/LoadingScreen';
import Login from '../Auth/Login';
import AppLayout from '../Layout/AppLayout';
import TaskDetails from './TaskDetails';

const TaskDetailsPage = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Loading application..." />;
  }
  
  if (!user) {
    return <Login />;
  }
  
  return (
    <AppLayout>
      <TaskDetails />
    </AppLayout>
  );
};

export default TaskDetailsPage;
