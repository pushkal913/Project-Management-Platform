import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard,
  FolderOpen,
  Assignment,
  People,
  Settings,
  Help
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ open, onToggle, isMobile }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isExtraSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: ['admin', 'standard']
    },
    {
      text: 'Projects',
      icon: <FolderOpen />,
      path: '/projects',
      roles: ['admin', 'standard']
    },
    {
      text: 'Tasks',
      icon: <Assignment />,
      path: '/tasks',
      roles: ['admin', 'standard']
    },
    {
      text: 'Team',
      icon: <People />,
      path: '/users',
      roles: ['admin']
    },
    
  ];

  const bottomMenuItems = [
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
      roles: ['admin']
    },
    {
      text: 'Help',
      icon: <Help />,
      path: '/help',
      roles: ['admin', 'standard']
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    // Close mobile drawer after navigation
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  // Remove location-based active detection - causes redirect blocker issues
  const isActive = (path) => {
    return false; // Disable active highlighting to avoid redirect blocker
  };

  const hasAccess = (roles) => {
    return roles.includes(user?.role);
  };

  const drawerWidth = isMobile ? 280 : (open ? 240 : 60);

  const renderMenuItem = (item, index) => {
    if (!hasAccess(item.roles)) return null;

    const active = isActive(item.path);

    return (
      <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
        <Tooltip title={(!open && !isMobile) ? item.text : ''} placement="right">
          <ListItemButton
            onClick={() => handleNavigation(item.path)}
            sx={{
              minHeight: 48,
              justifyContent: (open || isMobile) ? 'initial' : 'center',
              px: 2.5,
              py: 1.5,
              background: active 
                ? 'rgba(255, 255, 255, 0.15)' 
                : 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(10px)',
              border: active 
                ? '1px solid rgba(255, 255, 255, 0.25)' 
                : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: active 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
                  : 'transparent',
                borderRadius: 'inherit',
                pointerEvents: 'none'
              },
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transform: 'translateX(4px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                '&::before': {
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)'
                }
              },
              '&:active': {
                transform: 'translateX(2px) scale(0.98)'
              }
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: (open || isMobile) ? 3 : 'auto',
                justifyContent: 'center',
                color: active ? '#ffffff' : 'rgba(255,255,255,0.85)',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                transition: 'all 0.3s ease',
                transform: active ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                opacity: (open || isMobile) ? 1 : 0,
                color: '#ffffff',
                '& .MuiListItemText-primary': {
                  fontWeight: active ? 700 : 600,
                  fontSize: '0.95rem',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease'
                },
              }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={open}
      onClose={isMobile ? onToggle : undefined}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          border: 'none',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#ffffff',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
            pointerEvents: 'none'
          }
        },
      }}
    >
      <Box sx={{ 
        mt: isMobile ? 1 : 8,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1
      }}>
        {/* User Info Section */}
        {(open || isMobile) && (
          <Box sx={{ 
            p: 2, 
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            mx: 1,
            mb: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
            }
          }}>
            <Typography 
              variant="h6" 
              noWrap 
              sx={{ 
                color: '#ffffff',
                fontWeight: 600,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {user?.name?.split(' ')[0]}
            </Typography>
          </Box>
        )}
        
        <Divider sx={{ 
          borderColor: 'rgba(255,255,255,0.12)', 
          mx: 2,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }} />

        {/* Main Navigation */}
        <List sx={{ px: 1, flex: 1 }}>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </List>

        <Divider sx={{ 
          borderColor: 'rgba(255,255,255,0.12)', 
          mx: 2,
          my: 1,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }} />

        {/* Bottom Navigation */}
        <Box sx={{ 
          mt: 'auto',
          pb: 2
        }}>
          <List sx={{ px: 1 }}>
            {bottomMenuItems.map((item, index) => renderMenuItem(item, index))}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
