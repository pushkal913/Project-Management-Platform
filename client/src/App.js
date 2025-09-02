import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Projects from './components/Projects/Projects';
import ProjectDetails from './components/Projects/ProjectDetails';
import Tasks from './components/Tasks/Tasks';
import TaskDetails from './components/Tasks/TaskDetails';
import Users from './components/Users/Users';
import Profile from './components/Profile/Profile';
import Settings from './components/Settings/Settings';
import NotFound from './components/Common/NotFound';
import LoadingScreen from './components/Common/LoadingScreen';

// Modern Theme with Vibrant Colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1', // Modern indigo
      light: '#818cf8',
      dark: '#4338ca',
    },
    secondary: {
      main: '#ec4899', // Modern pink
      light: '#f472b6',
      dark: '#be185d',
    },
    success: {
      main: '#10b981', // Modern green
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b', // Modern amber
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444', // Modern red
      light: '#f87171',
      dark: '#dc2626',
    },
    background: {
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paper: '#ffffff',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
  },
  shape: {
    borderRadius: 16, // More rounded corners
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          borderRight: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px 0 rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 10px 25px 0 rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px 0 rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 10px 25px 0 rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px 0 rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Verifying authentication..." />;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Loading application..." />;
  }
  
  return !user ? children : <Navigate to="/dashboard" replace />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Checking permissions..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

// Main App Layout with Center Alignment
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
      }}
    >
      <Navbar onSidebarToggle={handleSidebarToggle} />
      <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          mt: 8,
          ml: sidebarOpen ? '240px' : '60px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '1400px',
          mx: 'auto',
          width: '100%',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '1200px',
            animation: 'fadeInUp 0.6s ease-out',
            '@keyframes fadeInUp': {
              '0%': {
                opacity: 0,
                transform: 'translateY(30px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SettingsProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Routes>
                  {/* Public Routes */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    }
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Dashboard />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Projects />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <ProjectDetails />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tasks"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Tasks />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tasks/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <TaskDetails />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Users />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Profile />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <AdminRoute>
                        <AppLayout>
                          <Settings />
                        </AppLayout>
                      </AdminRoute>
                    }
                  />

                  {/* Default Routes */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </SocketProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
