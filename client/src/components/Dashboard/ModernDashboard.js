import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Avatar, 
  AvatarGroup, 
  Button, 
  Divider,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  Group,
  CheckCircle,
  AccessTime,
  Warning,
  MoreVert,
  Add
} from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { faker } from '@faker-js/faker';

// Register ChartJS components
ChartJS.register(...registerables);

const ModernDashboard = () => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API calls
  const stats = {
    totalProjects: 12,
    completedProjects: 8,
    activeTasks: 24,
    teamMembers: 15
  };

  // Project status data
  const projectStatus = {
    planning: 3,
    active: 5,
    'on-hold': 2,
    completed: 2,
  };

  // Chart data
  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Tasks Completed',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        tension: 0.4,
        fill: true
      }
    ]
  };

  const taskDistributionData = {
    labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [35, 25, 25, 15],
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.main,
          theme.palette.error.main
        ]
      }
    ]
  };

  // Recent activities
  const recentActivities = [
    { id: 1, user: 'John Doe', action: 'completed', task: 'Dashboard Redesign', time: '2 min ago' },
    { id: 2, user: 'Jane Smith', action: 'updated', task: 'Project Timeline', time: '1 hour ago' },
    { id: 3, user: 'Mike Johnson', action: 'commented', task: 'Team Meeting Notes', time: '3 hours ago' },
    { id: 4, user: 'Sarah Wilson', action: 'uploaded', task: 'Design Assets', time: '5 hours ago' },
  ];

  // Team members
  const teamMembers = Array(5).fill().map((_, i) => ({
    id: i + 1,
    name: faker.person.fullName(),
    role: faker.person.jobTitle(),
    avatar: faker.image.avatar(),
    status: i % 3 === 0 ? 'available' : i % 2 === 0 ? 'busy' : 'offline'
  }));

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening with your projects.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<Add />}
          sx={{ borderRadius: '10px' }}
        >
          New Project
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<Assignment fontSize="large" />}
            title="Total Projects"
            value={stats.totalProjects}
            trend="+12%"
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<CheckCircle fontSize="large" />}
            title="Completed"
            value={stats.completedProjects}
            trend="+8%"
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<AccessTime fontSize="large" />}
            title="In Progress"
            value={stats.activeTasks}
            trend="+5%"
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<Group fontSize="large" />}
            title="Team Members"
            value={stats.teamMembers}
            trend="+2"
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, #1e1e2f, #252540)' 
                : 'linear-gradient(145deg, #f8f9ff, #ffffff)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Performance Overview</Typography>
              <Button size="small" endIcon={<MoreVert />}>
                View All
              </Button>
            </Box>
            <Box sx={{ height: 300 }}>
              <Line 
                data={performanceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      grid: {
                        color: theme.palette.divider
                      },
                      ticks: {
                        color: theme.palette.text.secondary
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: theme.palette.text.secondary
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Project Status */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, #1e1e2f, #252540)' 
                : 'linear-gradient(145deg, #f8f9ff, #ffffff)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Project Status</Typography>
            <Box sx={{ height: 200, position: 'relative' }}>
              <Pie 
                data={{
                  labels: Object.keys(projectStatus),
                  datasets: [{
                    data: Object.values(projectStatus),
                    backgroundColor: [
                      theme.palette.info.main,
                      theme.palette.success.main,
                      theme.palette.warning.main,
                      theme.palette.primary.main
                    ],
                    borderWidth: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: theme.palette.text.primary,
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, #1e1e2f, #252540)' 
                : 'linear-gradient(145deg, #f8f9ff, #ffffff)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Activity</Typography>
              <Button size="small" endIcon={<MoreVert />}>
                View All
              </Button>
            </Box>
            <Box>
              {recentActivities.map((activity) => (
                <Box key={activity.id} sx={{ display: 'flex', alignItems: 'center', py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                    {activity.user.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      <strong>{activity.user}</strong> {activity.action} <strong>{activity.task}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Team Members */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, #1e1e2f, #252540)' 
                : 'linear-gradient(145deg, #f8f9ff, #ffffff)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Team Members</Typography>
              <Button size="small" endIcon={<MoreVert />}>
                View All
              </Button>
            </Box>
            <Box>
              {teamMembers.map((member) => (
                <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ position: 'relative', mr: 2 }}>
                    <Avatar src={member.avatar} alt={member.name} />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: member.status === 'available' ? 'success.main' : 
                                 member.status === 'busy' ? 'error.main' : 'text.disabled',
                        border: `2px solid ${theme.palette.background.paper}`
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">{member.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {member.role}
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" color="inherit">
                    Message
                  </Button>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, trend, color }) => {
  return (
    <Paper 
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        height: '100%',
        background: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, #1e1e2f, #252540)' 
            : 'linear-gradient(145deg, #f8f9ff, #ffffff)',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box 
          sx={{ 
            width: 50,
            height: 50,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
            background: (theme) => alpha(color, 0.1),
            color: color
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
          {trend}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          vs last month
        </Typography>
      </Box>
    </Paper>
  );
};

export default ModernDashboard;
