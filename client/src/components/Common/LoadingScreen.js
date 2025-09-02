import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}
    >
      <CircularProgress 
        size={60} 
        sx={{ 
          color: 'white',
          mb: 3,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }} 
      />
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {message}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
        ProjectHub by TechKnoGeeks
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
