import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Grid } from '@mui/material';
import { useSettings } from '../../contexts/SettingsContext';

const Settings = () => {
  const { settings, setSettings } = useSettings();
  const [form, setForm] = useState({
    orgName: settings.orgName || '',
    brandingPrefix: settings.brandingPrefix || '',
    workHoursPerDay: settings.workHoursPerDay || 8,
    weekStart: settings.weekStart || 'Monday',
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: field === 'workHoursPerDay' ? Number(e.target.value) : e.target.value }));
  };

  const handleSave = () => {
    setSettings((prev) => ({ ...prev, ...form }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Organization Name"
              value={form.orgName}
              onChange={handleChange('orgName')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Branding Prefix (App Name)"
              value={form.brandingPrefix}
              onChange={handleChange('brandingPrefix')}
              helperText="Shown in the navbar (e.g., ProjectHub)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Work Hours Per Day"
              value={form.workHoursPerDay}
              onChange={handleChange('workHoursPerDay')}
              inputProps={{ min: 1, max: 24 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Week Starts On"
              value={form.weekStart}
              onChange={handleChange('weekStart')}
            >
              <MenuItem value="Monday">Monday</MenuItem>
              <MenuItem value="Sunday">Sunday</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
