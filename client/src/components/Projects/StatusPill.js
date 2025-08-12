import React from 'react';
import { Select, MenuItem, Box, Typography } from '@mui/material';

const StatusPill = ({ status, onStatusChange, getStatusColor }) => {
  const statusOptions = ['planning', 'active', 'on-hold', 'completed', 'archived'];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'white',
          display: 'block',
          mb: 0.5,
          ml: 1.5,
          fontSize: '0.9rem',
          fontWeight: 500
        }}
      >
        Status
      </Typography>
      <Box
        sx={{
          backgroundColor: getStatusColor(status),
          borderRadius: '16px',
          p: '8px 16px',
          display: 'inline-flex',
          alignItems: 'center',
          color: 'white',
          width: '100%',
        }}
      >
        <Select
          value={status}
          onChange={onStatusChange}
          variant="standard"
          disableUnderline
          fullWidth
          sx={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            '.MuiSelect-select:focus': {
              backgroundColor: 'transparent',
            },
            '.MuiSvgIcon-root': {
              color: 'white',
            },
          }}
        >
          {statusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              <Typography sx={{ textTransform: 'capitalize' }}>
                {option.replace('-', ' ')}
              </Typography>
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
};

export default StatusPill;
