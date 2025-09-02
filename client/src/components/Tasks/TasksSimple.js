import React from 'react';
import { Box, Typography } from '@mui/material';

const TasksSimple = () => {
  return (
    <Box p={3}>
      <Typography variant="h4">Simple Tasks Page</Typography>
      <Typography>This is a minimal tasks page to test reload behavior</Typography>
    </Box>
  );
};

export default TasksSimple;
