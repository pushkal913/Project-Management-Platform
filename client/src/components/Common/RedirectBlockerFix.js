import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

const RedirectBlockerFix = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    const currentPath = location.pathname;
    let shouldRedirect = false;
    let redirectPath = '';

    // Check if user is authenticated but on public routes
    if (user && (currentPath === '/login' || currentPath === '/register')) {
      shouldRedirect = true;
      redirectPath = '/dashboard';
    }
    // Check if user is not authenticated but on protected routes
    else if (!user && currentPath !== '/login' && currentPath !== '/register') {
      shouldRedirect = true;
      redirectPath = '/login';
    }

    if (shouldRedirect) {
      setRedirecting(true);
      // Use a delayed navigation to avoid redirect blocker
      const timer = setTimeout(() => {
        try {
          // Try using navigate first
          navigate(redirectPath, { replace: true });
        } catch (error) {
          // If navigate fails due to redirect blocker, use manual URL change
          console.log('Navigate blocked, using manual navigation');
          window.location.href = redirectPath;
        }
        setRedirecting(false);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return <LoadingScreen message="Loading application..." />;
  }

  if (redirecting) {
    return <LoadingScreen message="Redirecting..." />;
  }

  if (!shouldRender) {
    return <LoadingScreen message="Initializing..." />;
  }

  return children;
};

export default RedirectBlockerFix;
