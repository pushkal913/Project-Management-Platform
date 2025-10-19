import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Collapse,
  Tooltip,
  useTheme,
  useMediaQuery,
  TableContainer,
  TableSortLabel,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import {
  AccessTime,
  Person,
  Assignment,
  CalendarToday,
  TrendingUp,
  ExpandMore,
  ExpandLess,
  Search,
  Download,
  Timer,
  CheckCircle,
  Schedule,
  FolderOpen
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { toast } from 'react-toastify';

const Timesheet = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [timesheetData, setTimesheetData] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalHours: 0,
    totalTasks: 0,
    activeUsers: 0,
    avgHoursPerTask: 0
  });

  const [filters, setFilters] = useState({
    userId: '',
    projectId: '',
    timeRange: 'this-month',
    startDate: null,
    endDate: null,
    searchQuery: ''
  });

  const [viewMode, setViewMode] = useState(0); // 0: by-user, 1: by-task, 2: detailed
  const [expandedRows, setExpandedRows] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'totalHours', direction: 'desc' });

  useEffect(() => {
    fetchUsers();
    fetchProjects();
    fetchTimesheetData();
  }, [filters, viewMode]); // Add viewMode to dependencies

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    }
  };

  const fetchTimesheetData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add viewMode parameter
      const viewModeMap = ['by-user', 'by-task', 'detailed'];
      params.append('viewMode', viewModeMap[viewMode]);
      
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.timeRange && filters.timeRange !== 'custom') {
        params.append('timeRange', filters.timeRange);
      }
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.searchQuery) params.append('search', filters.searchQuery);

      const response = await axios.get(`/timesheet?${params.toString()}`);
      setTimesheetData(response.data.timesheetData);
      setSummaryStats(response.data.summary);
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
      toast.error('Failed to fetch timesheet data');
    } finally {
      setLoading(false);
    }
  };

  const getUserColor = (userId) => {
    const colors = [
      '#2563eb', // Vibrant Blue
      '#ea580c', // Vibrant Orange  
      '#16a34a', // Vibrant Green
      '#9333ea'  // Vibrant Purple
    ];
    
    if (!userId) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0xffffffff;
    }
    
    hash = hash ^ (hash >>> 16);
    hash = hash * 0x85ebca6b;
    hash = hash ^ (hash >>> 13);
    hash = hash * 0xc2b2ae35;
    hash = hash ^ (hash >>> 16);
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const sortData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'userName' || sortConfig.key === 'taskTitle') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const exportToCSV = () => {
    // Prepare CSV data based on current view
    let csvContent = '';
    
    if (viewMode === 0) {
      // By User view
      csvContent = 'User,Total Hours,Tasks Count,Projects\n';
      timesheetData.forEach(user => {
        csvContent += `"${user.userName}",${user.totalHours},${user.tasksCount},"${user.projects?.join(', ') || ''}"\n`;
      });
    } else if (viewMode === 1) {
      // By Task view
      csvContent = 'Task,Project,Total Hours,Contributors,Status\n';
      timesheetData.forEach(task => {
        csvContent += `"${task.taskTitle}","${task.projectName}",${task.totalHours},"${task.contributors?.join(', ') || ''}","${task.status}"\n`;
      });
    } else {
      // Detailed view
      csvContent = 'User,Task,Project,Hours,Date,Status\n';
      timesheetData.forEach(entry => {
        csvContent += `"${entry.userName}","${entry.taskTitle}","${entry.projectName}",${entry.hours},"${dayjs(entry.loggedAt).format('YYYY-MM-DD')}","${entry.status}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Timesheet exported successfully');
  };

  const renderByUserView = () => {
    const sortedData = sortData(timesheetData);

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortConfig.key === 'userName'}
                  direction={sortConfig.key === 'userName' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('userName')}
                  sx={{ color: 'white !important' }}
                >
                  User
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortConfig.key === 'totalHours'}
                  direction={sortConfig.key === 'totalHours' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('totalHours')}
                  sx={{ color: 'white !important' }}
                >
                  Total Hours
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortConfig.key === 'tasksCount'}
                  direction={sortConfig.key === 'tasksCount' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('tasksCount')}
                  sx={{ color: 'white !important' }}
                >
                  Tasks
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Projects</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((user) => (
              <React.Fragment key={user.userId}>
                <TableRow 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleRowExpand(user.userId)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: getUserColor(user.userId),
                          fontWeight: 700,
                          fontSize: '1rem'
                        }}
                      >
                        {user.userName?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
                          {user.userName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          {user.userEmail}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      icon={<Timer sx={{ fontSize: 16 }} />}
                      label={`${user.totalHours.toFixed(2)}h`}
                      sx={{
                        bgcolor: 'rgba(37, 99, 235, 0.2)',
                        color: '#60a5fa',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      icon={<Assignment sx={{ fontSize: 16 }} />}
                      label={user.tasksCount}
                      sx={{
                        bgcolor: 'rgba(34, 197, 94, 0.2)',
                        color: '#4ade80',
                        fontWeight: 700
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.projects?.slice(0, 3).map((project, idx) => (
                        <Chip
                          key={idx}
                          label={project}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(147, 51, 234, 0.2)',
                            color: '#c084fc',
                            fontSize: '0.75rem'
                          }}
                        />
                      ))}
                      {user.projects?.length > 3 && (
                        <Chip
                          label={`+${user.projects.length - 3}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(147, 51, 234, 0.2)',
                            color: '#c084fc',
                            fontSize: '0.75rem'
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" sx={{ color: 'white' }}>
                      {expandedRows[user.userId] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expandedRows[user.userId]} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
                        <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, fontWeight: 700 }}>
                          Task Breakdown
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Task</TableCell>
                              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Project</TableCell>
                              <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Hours</TableCell>
                              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {user.tasks?.map((task, idx) => (
                              <TableRow 
                                key={idx}
                                sx={{ 
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                }}
                                onClick={() => navigate(`/tasks/${task.taskId}`)}
                              >
                                <TableCell sx={{ color: 'white' }}>{task.taskTitle}</TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>{task.projectName}</TableCell>
                                <TableCell align="right" sx={{ color: '#60a5fa', fontWeight: 600 }}>
                                  {task.hours.toFixed(2)}h
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={task.status?.replace('-', ' ')}
                                    size="small"
                                    sx={{
                                      bgcolor: task.status === 'done' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                                      color: task.status === 'done' ? '#4ade80' : '#fb923c',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.6)' }}>
                  No timesheet data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderByTaskView = () => {
    const sortedData = sortData(timesheetData);

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortConfig.key === 'taskTitle'}
                  direction={sortConfig.key === 'taskTitle' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('taskTitle')}
                  sx={{ color: 'white !important' }}
                >
                  Task
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Project</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortConfig.key === 'totalHours'}
                  direction={sortConfig.key === 'totalHours' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('totalHours')}
                  sx={{ color: 'white !important' }}
                >
                  Total Hours
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Contributors</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((task) => (
              <React.Fragment key={task.taskId}>
                <TableRow 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleRowExpand(task.taskId)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assignment sx={{ color: '#60a5fa', fontSize: 20 }} />
                      <Typography sx={{ color: 'white', fontWeight: 600 }}>
                        {task.taskTitle}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FolderOpen sx={{ fontSize: 16, color: '#c084fc' }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {task.projectName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      icon={<Timer sx={{ fontSize: 16 }} />}
                      label={`${task.totalHours.toFixed(2)}h`}
                      sx={{
                        bgcolor: 'rgba(37, 99, 235, 0.2)',
                        color: '#60a5fa',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {task.contributors?.slice(0, 3).map((contributor, idx) => (
                        <Tooltip key={idx} title={contributor} arrow>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: getUserColor(contributor),
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            {contributor.charAt(0).toUpperCase()}
                          </Avatar>
                        </Tooltip>
                      ))}
                      {task.contributors?.length > 3 && (
                        <Chip
                          label={`+${task.contributors.length - 3}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(147, 51, 234, 0.2)',
                            color: '#c084fc',
                            height: 24,
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status?.replace('-', ' ')}
                      size="small"
                      sx={{
                        bgcolor: task.status === 'done' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                        color: task.status === 'done' ? '#4ade80' : '#fb923c',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" sx={{ color: 'white' }}>
                      {expandedRows[task.taskId] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expandedRows[task.taskId]} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
                        <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, fontWeight: 700 }}>
                          Time Logs by User
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>User</TableCell>
                              <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Hours Logged</TableCell>
                              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Last Updated</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {task.userBreakdown?.map((entry, idx) => (
                              <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        bgcolor: getUserColor(entry.userId),
                                        fontSize: '0.75rem',
                                        fontWeight: 700
                                      }}
                                    >
                                      {entry.userName.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                                      {entry.userName}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="right" sx={{ color: '#60a5fa', fontWeight: 600 }}>
                                  {entry.hours.toFixed(2)}h
                                </TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                  {dayjs(entry.lastLog).format('MMM DD, YYYY HH:mm')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.6)' }}>
                  No timesheet data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderDetailedView = () => {
    const sortedData = sortData(timesheetData);

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Task</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Project</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortConfig.key === 'hours'}
                  direction={sortConfig.key === 'hours' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('hours')}
                  sx={{ color: 'white !important' }}
                >
                  Hours
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortConfig.key === 'loggedAt'}
                  direction={sortConfig.key === 'loggedAt' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('loggedAt')}
                  sx={{ color: 'white !important' }}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((entry, index) => (
              <TableRow 
                key={index}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/tasks/${entry.taskId}`)}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: getUserColor(entry.userId),
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}
                    >
                      {entry.userName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                      {entry.userName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: 'white' }}>{entry.taskTitle}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>{entry.projectName}</TableCell>
                <TableCell align="right">
                  <Chip
                    icon={<Timer sx={{ fontSize: 14 }} />}
                    label={`${entry.hours.toFixed(2)}h`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(37, 99, 235, 0.2)',
                      color: '#60a5fa',
                      fontWeight: 700
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {dayjs(entry.loggedAt).format('MMM DD, YYYY HH:mm')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={entry.status?.replace('-', ' ')}
                    size="small"
                    sx={{
                      bgcolor: entry.status === 'done' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                      color: entry.status === 'done' ? '#4ade80' : '#fb923c',
                      fontSize: '0.7rem'
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.6)' }}>
                  No timesheet data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Timesheet
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant={isSmallScreen ? "h5" : "h4"} sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
              Timesheet
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Detailed time tracking across users and tasks
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportToCSV}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Export CSV
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccessTime sx={{ color: 'white', fontSize: isSmallScreen ? 24 : 28 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: isSmallScreen ? '1.5rem' : '2rem' }}>
                    {summaryStats.totalHours.toFixed(1)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  Total Hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: 3,
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Assignment sx={{ color: 'white', fontSize: isSmallScreen ? 24 : 28 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: isSmallScreen ? '1.5rem' : '2rem' }}>
                    {summaryStats.totalTasks}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  Total Tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: 3,
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person sx={{ color: 'white', fontSize: isSmallScreen ? 24 : 28 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: isSmallScreen ? '1.5rem' : '2rem' }}>
                    {summaryStats.activeUsers}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  Active Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: 3,
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingUp sx={{ color: 'white', fontSize: isSmallScreen ? 24 : 28 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: isSmallScreen ? '1.5rem' : '2rem' }}>
                    {summaryStats.avgHoursPerTask.toFixed(1)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  Avg Hours/Task
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#9ca3af', fontWeight: 500 }}>All Users</span>;
                    }
                    const user = users.find(u => u._id === selected);
                    return <span style={{ fontWeight: 500 }}>{user?.name || 'All Users'}</span>;
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.98)',
                    borderRadius: 2,
                    '& fieldset': { border: 'none' },
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                  }}
                >
                  <MenuItem value="">All Users</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>{user.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.projectId}
                  onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#9ca3af', fontWeight: 500 }}>All Projects</span>;
                    }
                    const project = projects.find(p => p._id === selected);
                    return <span style={{ fontWeight: 500 }}>{project?.name || 'All Projects'}</span>;
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.98)',
                    borderRadius: 2,
                    '& fieldset': { border: 'none' },
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                  }}
                >
                  <MenuItem value="">All Projects</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>{project.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.timeRange}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({ 
                      ...filters, 
                      timeRange: val,
                      startDate: val === 'custom' ? filters.startDate : null,
                      endDate: val === 'custom' ? filters.endDate : null
                    });
                  }}
                  displayEmpty
                  renderValue={(selected) => {
                    const map = {
                      'this-week': 'This Week',
                      'this-month': 'This Month',
                      'last-month': 'Last Month',
                      'this-year': 'This Year',
                      'custom': 'Custom Range'
                    };
                    return <span style={{ fontWeight: 500 }}>{map[selected] || 'This Month'}</span>;
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.98)',
                    borderRadius: 2,
                    '& fieldset': { border: 'none' },
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                  }}
                >
                  <MenuItem value="this-week">This Week</MenuItem>
                  <MenuItem value="this-month">This Month</MenuItem>
                  <MenuItem value="last-month">Last Month</MenuItem>
                  <MenuItem value="this-year">This Year</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search tasks..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#6b7280' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.98)',
                  borderRadius: 2,
                  '& fieldset': { border: 'none' },
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                }}
              />
            </Grid>
            {filters.timeRange === 'custom' && (
              <>
                <Grid item xs={6} sm={6} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(date) => setFilters({ ...filters, startDate: date })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.98)',
                          borderRadius: 2,
                          '& fieldset': { border: 'none' },
                          boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(date) => setFilters({ ...filters, endDate: date })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.98)',
                          borderRadius: 2,
                          '& fieldset': { border: 'none' },
                          boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        {/* View Mode Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 999, px: 1, py: 0.75, backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <Tabs
            value={viewMode}
            onChange={(e, val) => setViewMode(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-flexContainer': { gap: 0.5 },
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                minHeight: 44,
                color: '#374151'
              },
              '& .MuiTab-root.Mui-selected': {
                color: '#111827',
                backgroundColor: 'rgba(255,255,255,0.95)'
              }
            }}
          >
            <Tab
              label="By User"
              icon={<Person sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ borderRadius: 999, px: 3, mx: 0.25 }}
            />
            <Tab
              label="By Task"
              icon={<Assignment sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ borderRadius: 999, px: 3, mx: 0.25 }}
            />
            <Tab
              label="Detailed"
              icon={<Schedule sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ borderRadius: 999, px: 3, mx: 0.25 }}
            />
          </Tabs>
        </Paper>

        {/* Data Table */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.05)' }}>
          {viewMode === 0 && renderByUserView()}
          {viewMode === 1 && renderByTaskView()}
          {viewMode === 2 && renderDetailedView()}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default Timesheet;
