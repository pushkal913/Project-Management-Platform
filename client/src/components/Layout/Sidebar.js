import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Typography
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

const Sidebar = ({ open, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

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
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const hasAccess = (roles) => {
    return roles.includes(user?.role);
  };

  const drawerWidth = open ? 240 : 60;

  const renderMenuItem = (item, index) => {
    if (!hasAccess(item.roles)) return null;

    const active = isActive(item.path);

    return (
      <ListItem key={item.text} disablePadding>
        <Tooltip title={!open ? item.text : ''} placement="right">
          <ListItemButton
            onClick={() => handleNavigation(item.path)}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
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
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
                color: active ? '#ffffff' : 'rgba(255,255,255,0.9)',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                opacity: open ? 1 : 0,
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
      variant="permanent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: 'width 0.3s',
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ mt: 8 }}>
        {/* User Info Section */}
        {open && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" noWrap>
              {user?.name?.split(' ')[0]}
            </Typography>
          </Box>
        )}
        
        <Divider />

        {/* Main Navigation */}
        <List>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </List>

        <Divider />

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
