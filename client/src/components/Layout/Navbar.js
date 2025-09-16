import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Box,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Settings,
  ExitToApp,
  Person,
  Business
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useSocket } from '../../contexts/SocketContext';

const Navbar = ({ onSidebarToggle, isMobile }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { connected } = useSocket();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#f44336',
      standard: '#2196f3'
    };
    return colors[role] || '#757575';
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          borderRadius: 'inherit',
          pointerEvents: 'none'
        }
      }}
    >
      <Toolbar sx={{ 
        minHeight: { xs: 56, sm: 64 },
        px: { xs: 2, sm: 3 },
        position: 'relative',
        zIndex: 1
      }}>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          onClick={onSidebarToggle}
          edge="start"
          sx={{ 
            mr: { xs: 1, sm: 2 },
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mr: { xs: 1, sm: 2 }, 
          flexGrow: 1, 
          minWidth: 0,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          px: 2,
          py: 0.5,
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }
        }}>
          <Business sx={{ 
            mr: 1, 
            color: 'inherit', 
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
          }} />
          <Typography 
            variant={isSmallScreen ? "subtitle1" : "h6"} 
            noWrap 
            component="div" 
            color="inherit"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1.25rem' },
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {isSmallScreen 
              ? (settings?.brandingPrefix || 'ProjectHub')
              : `${settings?.brandingPrefix || 'ProjectHub'} • ${settings?.orgName || 'TechKnoGeeks'}`
            }
          </Typography>
        </Box>

        {/* Connection Status - Hide on very small screens */}
        {!isSmallScreen && (
          <Tooltip title={connected ? 'Connected' : 'Disconnected'}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: connected 
                  ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                  : 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
                mr: 2,
                boxShadow: connected 
                  ? '0 0 12px rgba(76, 175, 80, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                  : '0 0 12px rgba(244, 67, 54, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                animation: connected ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { boxShadow: `0 0 12px rgba(76, 175, 80, 0.6)` },
                  '50%': { boxShadow: `0 0 20px rgba(76, 175, 80, 0.8)` },
                  '100%': { boxShadow: `0 0 12px rgba(76, 175, 80, 0.6)` }
                }
              }}
            />
          </Tooltip>
        )}

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            color="inherit"
            onClick={handleNotificationMenuOpen}
            sx={{ 
              mr: { xs: 0.5, sm: 1 },
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }
            }}
            size={isSmallScreen ? "small" : "medium"}
          >
            <Badge 
              badgeContent={0} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  background: 'linear-gradient(135deg, #f44336 0%, #ff5722 100%)',
                  boxShadow: '0 2px 8px rgba(244, 67, 54, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              <Notifications fontSize={isSmallScreen ? "small" : "medium"} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Profile */}
        <Tooltip title="Account">
          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{ 
              p: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            <Avatar
              sx={{
                bgcolor: getRoleColor(user?.role),
                width: isSmallScreen ? 32 : 40,
                height: isSmallScreen ? 32 : 40,
                fontSize: isSmallScreen ? '0.875rem' : '1rem',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                background: `linear-gradient(135deg, ${getRoleColor(user?.role)} 0%, ${getRoleColor(user?.role)}88 100%)`
              }}
              src={user?.avatar}
            >
              {user?.avatar ? null : getInitials(user?.name || 'User')}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          onClick={handleProfileMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              mt: 1.5,
              overflow: 'visible',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: 'inherit',
                pointerEvents: 'none'
              },
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ 
            px: 2, 
            py: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px 12px 0 0'
          }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'white' }}>
              {user?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {user?.email}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: getRoleColor(user?.role),
                textTransform: 'capitalize',
                fontWeight: 'bold'
              }}
            >
              {user?.role}
            </Typography>
          </Box>
          <MenuItem 
            onClick={handleProfileClick}
            sx={{
              color: 'white',
              borderRadius: '8px',
              margin: '4px 8px',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                transform: 'translateX(4px)'
              }
            }}
          >
            <Person sx={{ mr: 1, filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }} />
            Profile
          </MenuItem>
          <MenuItem 
            onClick={handleSettingsClick}
            sx={{
              color: 'white',
              borderRadius: '8px',
              margin: '4px 8px',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                transform: 'translateX(4px)'
              }
            }}
          >
            <Settings sx={{ mr: 1, filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }} />
            Settings
          </MenuItem>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '8px' }} />
          <MenuItem 
            onClick={handleLogout}
            sx={{
              color: '#ff6b6b',
              borderRadius: '8px',
              margin: '4px 8px',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 107, 107, 0.1)',
                backdropFilter: 'blur(10px)',
                transform: 'translateX(4px)'
              }
            }}
          >
            <ExitToApp sx={{ mr: 1, filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationMenuClose}
          PaperProps={{
            sx: {
              width: { xs: '90vw', sm: 320 },
              maxWidth: 320,
              maxHeight: 400,
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: 'inherit',
                pointerEvents: 'none'
              }
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ 
            p: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px 12px 0 0'
          }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Notifications
            </Typography>
          </Box>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              No new notifications
            </Typography>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
