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
  Button
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
        <Typography variant="h4" gutterBottom>
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchDashboardData}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              transform: 'translateY(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              '@keyframes bounce': {
                '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                '40%': { transform: 'translateY(-10px)' },
                '60%': { transform: 'translateY(-5px)' },
              },
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)',
                '& .bounceIcon': { animation: 'bounce 2s infinite' }
              },
            }}
            onClick={() => navigate('/tasks')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    p: 1.5,
                    mr: 2,
                    '&.bounceIcon': {},
                  }}
                  className="bounceIcon"
                >
                  <Assignment sx={{ fontSize: 32, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {dashboardData?.totalTasks || 0}
                  </Typography>
                  <Typography sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Total Tasks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' }, transition: 'all .2s' }}
            onClick={() => navigate('/projects')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FolderOpen sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {dashboardData?.totalProjects || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Projects
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' }, transition: 'all .2s' }}
            onClick={() => navigate('/tasks')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {dashboardData?.myTasks || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    My Tasks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' }, transition: 'all .2s' }}
            onClick={() => navigate('/tasks')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {dashboardData?.overdueTasks || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Overdue Tasks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Status Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
            <Typography variant="h6" gutterBottom>
              Task Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
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
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 14, fill: '#555' }}>
                    {`${nonZeroTaskData[0].name} 100%`}
                  </text>
                )}
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Project Status Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, cursor: 'pointer' }} onClick={() => navigate('/projects')}>
            <Typography variant="h6" gutterBottom>
              Project Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {projectChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <List>
              {dashboardData?.recentActivities?.slice(0, 5).map((task, index) => (
                <ListItem key={task._id} button onClick={() => navigate(`/tasks/${task._id}`)}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getStatusColor(task.status) }}>
                      <Assignment />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {task.project?.name}
                        </Typography>
                        <Chip
                          label={task.status}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(task.status),
                            color: 'white',
                            mt: 0.5
                          }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              )) || (
                <ListItem>
                  <ListItemText primary="No recent activities" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Deadlines */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Deadlines
            </Typography>
            <List>
              {dashboardData?.upcomingDeadlines?.map((task, index) => (
                <ListItem key={task._id} button onClick={() => navigate(`/tasks/${task._id}`)}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getPriorityColor(task.priority) }}>
                      <Schedule />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Due: {formatDate(task.dueDate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.project?.name}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              )) || (
                <ListItem>
                  <ListItemText primary="No upcoming deadlines" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Team Workload (admin only) */}
        {user?.role === 'admin' && dashboardData?.teamWorkload?.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Team Workload
              </Typography>
              <Grid container spacing={2}>
                {dashboardData.teamWorkload.map((member, index) => (
                  <Grid item xs={12} sm={6} md={4} key={member._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ mr: 2 }}>
                            {member.user.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1">
                              {member.user.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {member.user.email}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Typography variant="body2">
                            Tasks: {member.taskCount}
                          </Typography>
                          <Typography variant="body2" color="error">
                            High Priority: {member.highPriorityTasks}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Time Report (admin only) */}
        {user?.role === 'admin' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Time Report (Per User)</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl size="small">
                    <InputLabel id="report-period-label">Period</InputLabel>
                    <Select
                      labelId="report-period-label"
                      label="Period"
                      value={reportPeriod}
                      onChange={(e) => setReportPeriod(e.target.value)}
                    >
                      <MenuItem value={'7'}>Last 7 days</MenuItem>
                      <MenuItem value={'30'}>Last 30 days</MenuItem>
                    </Select>
                  </FormControl>
                  <Tooltip title="Refresh">
                    <IconButton onClick={() => fetchTimeReport(reportPeriod)}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {timeReportLoading ? (
                <LinearProgress />
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {timeReport?.period?.start ? new Date(timeReport.period.start).toLocaleDateString() : ''}
                    {timeReport?.period?.end ? ` - ${new Date(timeReport.period.end).toLocaleDateString()}` : ''}
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell align="right">Total Hours</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(timeReport?.totalsByUser || []).map((row) => (
                        <TableRow key={row.user._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24 }}>
                                {row.user.name ? row.user.name[0] : '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{row.user.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{row.user.email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{row.totalHours?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {(timeReport?.totalsByUser || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} align="center">No time logs in selected period</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
