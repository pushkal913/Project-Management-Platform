import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../Common/LoadingScreen';
import Login from '../Auth/Login';
import AppLayout from '../Layout/AppLayout';
import Profile from './Profile';

const ProfilePage = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Loading application..." />;
  }
  
  if (!user) {
    return <Login />;
  }
  
  return (
    <AppLayout>
      <Profile />
    </AppLayout>
  );
};

export default ProfilePage;
