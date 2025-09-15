import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Assignment,
  FolderOpen,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  Refresh
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeReport, setTimeReport] = useState(null);
  const [timeReportLoading, setTimeReportLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('7'); // days

  useEffect(() => {
    fetchDashboardData();
    if (user?.role === 'admin') {
      fetchTimeReport(reportPeriod);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchTimeReport(reportPeriod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/dashboard/overview');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeReport = async (period) => {
    try {
      setTimeReportLoading(true);
      const res = await axios.get(`/dashboard/time-report?period=${period}`);
      setTimeReport(res.data);
    } catch (e) {
      console.error('Error fetching time report:', e);
    } finally {
      setTimeReportLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: '#f44336',
      'in-progress': '#ff9800',
      review: '#2196f3',
      testing: '#9c27b0',
      done: '#4caf50',
      planning: '#757575',
      active: '#4caf50',
      'on-hold': '#ff9800',
      completed: '#4caf50',
      cancelled: '#f44336'
    };
    return colors[status] || '#757575';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f'
    };
    return colors[priority] || '#757575';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  const taskChartData = dashboardData ? [
    { name: 'To Do', value: dashboardData.taskStats.todo, color: '#ef4444' },
    { name: 'In Progress', value: dashboardData.taskStats['in-progress'], color: '#f59e0b' },
    { name: 'Review', value: dashboardData.taskStats.review, color: '#3b82f6' },
    { name: 'Testing', value: dashboardData.taskStats.testing, color: '#8b5cf6' },
    { name: 'Done', value: dashboardData.taskStats.done, color: '#10b981' }
  ] : [];

  // Filter out zero-value slices to avoid cluttered labels; determine single-slice case
  const nonZeroTaskData = taskChartData.filter(d => d.value > 0);

  const projectChartData = dashboardData ? [
    { name: 'Planning', value: dashboardData.projectStats.planning, color: '#6b7280' },
    { name: 'Active', value: dashboardData.projectStats.active, color: '#10b981' },
    { name: 'On Hold', value: dashboardData.projectStats['on-hold'], color: '#f59e0b' },
    { name: 'Completed', value: dashboardData.projectStats.completed, color: '#10b981' },
    { name: 'Cancelled', value: dashboardData.projectStats.cancelled, color: '#ef4444' }
  ] : [];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: { xs: 2, sm: 3, md: 4 },
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant={isSmallScreen ? "h5" : "h4"} sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography variant={isSmallScreen ? "body2" : "body1"} sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Welcome back! Here's what's happening with your projects
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton 
            onClick={fetchDashboardData}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
                transform: 'rotate(180deg)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Modern Statistics Cards */}
        <Grid item xs={6} sm={6} md={3}>
          <Card 
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: { xs: 2, sm: 4 },
              border: 'none',
              boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              height: { xs: 120, sm: 140, md: 160 }, // Responsive height
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease'
              },
              '&:hover': {
                transform: { xs: 'translateY(-4px)', sm: 'translateY(-8px)', md: 'translateY(-12px) scale(1.02)' },
                boxShadow: '0 25px 50px rgba(102, 126, 234, 0.4)',
                '&::before': { opacity: 1 }
              },
            }}
            onClick={() => navigate('/tasks')}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant={isMobile ? "h5" : "h3"} 
                    component="div" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 0.5,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                    }}
                  >
                    {dashboardData?.totalTasks || 0}
                  </Typography>
                  <Typography sx={{ 
                    opacity: 0.9, 
                    fontWeight: 600, 
                    fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1.1rem' },
                    lineHeight: 1.2
                  }}>
                    Total Tasks
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    p: { xs: 1, sm: 1.5, md: 2 },
                    backdropFilter: 'blur(10px)',
                    ml: 1
                  }}
                >
                  <Assignment sx={{ fontSize: { xs: 20, sm: 24, md: 32 }, color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              borderRadius: { xs: 2, sm: 4 },
              border: 'none',
              boxShadow: '0 20px 40px rgba(17, 153, 142, 0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              height: { xs: 120, sm: 140, md: 160 },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease'
              },
              '&:hover': {
                transform: { xs: 'translateY(-4px)', sm: 'translateY(-8px)', md: 'translateY(-12px) scale(1.02)' },
                boxShadow: '0 25px 50px rgba(17, 153, 142, 0.4)',
                '&::before': { opacity: 1 }
              },
            }}
            onClick={() => navigate('/projects')}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant={isMobile ? "h5" : "h3"} 
                    component="div" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 0.5,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                    }}
                  >
                    {dashboardData?.totalProjects || 0}
                  </Typography>
                  <Typography sx={{ 
                    opacity: 0.9, 
                    fontWeight: 600, 
                    fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1.1rem' },
                    lineHeight: 1.2
                  }}>
                    Total Projects
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    p: { xs: 1, sm: 1.5, md: 2 },
                    backdropFilter: 'blur(10px)',
                    ml: 1
                  }}
                >
                  <FolderOpen sx={{ fontSize: { xs: 20, sm: 24, md: 32 }, color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              borderRadius: { xs: 2, sm: 4 },
              border: 'none',
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              height: { xs: 120, sm: 140, md: 160 },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease'
              },
              '&:hover': {
                transform: { xs: 'translateY(-4px)', sm: 'translateY(-8px)', md: 'translateY(-12px) scale(1.02)' },
                boxShadow: '0 25px 50px rgba(59, 130, 246, 0.4)',
                '&::before': { opacity: 1 }
              },
            }}
            onClick={() => navigate('/tasks')}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant={isMobile ? "h5" : "h3"} 
                    component="div" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 0.5,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                    }}
                  >
                    {dashboardData?.myTasks || 0}
                  </Typography>
                  <Typography sx={{ 
                    opacity: 0.9, 
                    fontWeight: 600, 
                    fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1.1rem' },
                    lineHeight: 1.2
                  }}>
                    My Tasks
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    p: { xs: 1, sm: 1.5, md: 2 },
                    backdropFilter: 'blur(10px)',
                    ml: 1
                  }}
                >
                  <Person sx={{ fontSize: { xs: 20, sm: 24, md: 32 }, color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
              color: 'white',
              borderRadius: { xs: 2, sm: 4 },
              border: 'none',
              boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              height: { xs: 120, sm: 140, md: 160 },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease'
              },
              '&:hover': {
                transform: { xs: 'translateY(-4px)', sm: 'translateY(-8px)', md: 'translateY(-12px) scale(1.02)' },
                boxShadow: '0 25px 50px rgba(245, 158, 11, 0.4)',
                '&::before': { opacity: 1 }
              },
            }}
            onClick={() => navigate('/tasks')}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant={isMobile ? "h5" : "h3"} 
                    component="div" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 0.5,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                    }}
                  >
                    {dashboardData?.overdueTasks || 0}
                  </Typography>
                  <Typography sx={{ 
                    opacity: 0.9, 
                    fontWeight: 600, 
                    fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1.1rem' },
                    lineHeight: 1.2
                  }}>
                    Overdue Tasks
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    p: { xs: 1, sm: 1.5, md: 2 },
                    backdropFilter: 'blur(10px)',
                    ml: 1
                  }}
                >
                  <Warning sx={{ fontSize: { xs: 20, sm: 24, md: 32 }, color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Modern Chart Cards */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              borderRadius: 4,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
              }
            }}
            onClick={() => navigate('/tasks')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2
                  }}
                >
                  <Assignment sx={{ fontSize: 24, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Task Status Distribution
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overview of all task statuses
                  </Typography>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <PieChart>
                  <Pie
                    data={nonZeroTaskData}
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={-270}
                    labelLine={false}
                    paddingAngle={nonZeroTaskData.length > 1 ? 2 : 0}
                    label={nonZeroTaskData.length > 1 ? (({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`) : false}
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {nonZeroTaskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {nonZeroTaskData.length === 1 && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 14, fill: '#555', fontWeight: 600 }}>
                      {`${nonZeroTaskData[0].name} 100%`}
                    </text>
                  )}
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              borderRadius: 4,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
              }
            }}
            onClick={() => navigate('/projects')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2
                  }}
                >
                  <FolderOpen sx={{ fontSize: 24, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Project Status Distribution
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overview of all project statuses
                  </Typography>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <BarChart data={projectChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {projectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Modern Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              borderRadius: 4,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2
                  }}
                >
                  <TrendingUp sx={{ fontSize: 24, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Recent Activities
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Latest task updates
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {dashboardData?.recentActivities?.slice(0, 5).map((task, index) => (
                  <Box
                    key={task._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)',
                        transform: 'translateX(4px)'
                      }
                    }}
                    onClick={() => navigate(`/tasks/${task._id}`)}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: getStatusColor(task.status),
                        width: 40,
                        height: 40,
                        mr: 2
                      }}
                    >
                      <Assignment sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {task.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {task.project?.name}
                      </Typography>
                      <Chip
                        label={task.status.replace('-', ' ')}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(task.status),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </Box>
                )) || (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No recent activities</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Modern Upcoming Deadlines */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              borderRadius: 4,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2
                  }}
                >
                  <Schedule sx={{ fontSize: 24, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Upcoming Deadlines
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tasks due soon
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {dashboardData?.upcomingDeadlines?.map((task, index) => (
                  <Box
                    key={task._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)',
                        transform: 'translateX(4px)'
                      }
                    }}
                    onClick={() => navigate(`/tasks/${task._id}`)}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: getPriorityColor(task.priority),
                        width: 40,
                        height: 40,
                        mr: 2
                      }}
                    >
                      <Schedule sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {task.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {task.project?.name}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600,
                        color: new Date(task.dueDate) < new Date() ? 'error.main' : 'warning.main'
                      }}>
                        Due: {formatDate(task.dueDate)}
                      </Typography>
                    </Box>
                  </Box>
                )) || (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No upcoming deadlines</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Modern Team Workload (admin only) */}
        {user?.role === 'admin' && dashboardData?.teamWorkload?.length > 0 && (
          <Grid item xs={12}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                      borderRadius: '50%',
                      p: 1,
                      mr: 2
                    }}
                  >
                    <Person sx={{ fontSize: 24, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Team Workload
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overview of team member assignments
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={3}>
                  {dashboardData.teamWorkload.map((member, index) => (
                    <Grid item xs={12} sm={6} md={4} key={member._id}>
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          backgroundColor: 'rgba(0,0,0,0.02)',
                          border: '1px solid rgba(0,0,0,0.05)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar 
                            sx={{ 
                              mr: 2,
                              width: 48,
                              height: 48,
                              bgcolor: 'primary.main',
                              fontSize: '1.2rem',
                              fontWeight: 700
                            }}
                          >
                            {member.user.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {member.user.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {member.user.email}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {member.taskCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Tasks
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                              {member.highPriorityTasks}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              High Priority
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Modern Time Report (admin only) */}
        {user?.role === 'admin' && (
          <Grid item xs={12}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mb: 3,
                  flexWrap: 'wrap',
                  gap: 1
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                        borderRadius: '50%',
                        p: 1,
                        mr: 2
                      }}
                    >
                      <TrendingUp sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant={isSmallScreen ? "subtitle1" : "h6"} sx={{ fontWeight: 700, mb: 0.5 }}>
                        Time Report (Per User)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Team productivity overview
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small">
                      <InputLabel id="report-period-label">Period</InputLabel>
                      <Select
                        labelId="report-period-label"
                        label="Period"
                        value={reportPeriod}
                        onChange={(e) => setReportPeriod(e.target.value)}
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value={'7'}>Last 7 days</MenuItem>
                        <MenuItem value={'30'}>Last 30 days</MenuItem>
                        <MenuItem value={'this-month'}>This Month</MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip title="Refresh">
                      <IconButton 
                        onClick={() => fetchTimeReport(reportPeriod)}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.04)',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' }
                        }}
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {timeReportLoading ? (
                  <LinearProgress sx={{ borderRadius: 1 }} />
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {timeReport?.period?.start ? new Date(timeReport.period.start).toLocaleDateString() : ''}
                      {timeReport?.period?.end ? ` - ${new Date(timeReport.period.end).toLocaleDateString()}` : ''}
                    </Typography>
                    <Box sx={{ 
                      borderRadius: 2, 
                      overflow: 'hidden', 
                      border: '1px solid rgba(0,0,0,0.05)',
                      overflowX: 'auto' // Add horizontal scroll for mobile
                    }}>
                      <Table size={isSmallScreen ? "small" : "medium"}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: isSmallScreen ? '0.75rem' : 'inherit' }}>User</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: isSmallScreen ? '0.75rem' : 'inherit' }}>Total Hours</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(timeReport?.totalsByUser || []).map((row) => (
                            <TableRow 
                              key={row.user._id} 
                              hover
                              sx={{ 
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                                transition: 'background-color 0.2s ease'
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    {row.user.name ? row.user.name[0] : '?'}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {row.user.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {row.user.email}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {row.totalHours?.toFixed(2)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(timeReport?.totalsByUser || []).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                                <Typography color="text.secondary">No time logs in selected period</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
