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
  Help,
  Description
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
      text: 'Documents',
      icon: <Description />,
      path: '/documents',
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
      <ListItem key={item.text} disablePadding>
        <Tooltip title={(!open && !isMobile) ? item.text : ''} placement="right">
          <ListItemButton
            onClick={() => handleNavigation(item.path)}
            sx={{
              minHeight: 48,
              justifyContent: (open || isMobile) ? 'initial' : 'center',
              px: 2.5,
              backgroundColor: active ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
              borderLeft: active ? '3px solid #ffffff' : '3px solid transparent',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.10)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: (open || isMobile) ? 3 : 'auto',
                justifyContent: 'center',
                color: active ? '#ffffff' : 'rgba(255,255,255,0.9)',
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
                  fontWeight: active ? 800 : 700,
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
          transition: 'width 0.3s',
          overflowX: 'hidden',
          backgroundColor: '#1976d2',
          color: '#ffffff',
        },
      }}
    >
      <Box sx={{ mt: isMobile ? 1 : 8 }}>
        {/* User Info Section */}
        {(open || isMobile) && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" noWrap sx={{ color: '#ffffff' }}>
              {user?.name?.split(' ')[0]}
            </Typography>
          </Box>
        )}
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        {/* Main Navigation */}
        <List>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </List>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        {/* Bottom Navigation */}
        <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
          <List>
            {bottomMenuItems.map((item, index) => renderMenuItem(item, index))}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
