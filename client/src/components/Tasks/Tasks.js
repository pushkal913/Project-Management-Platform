import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Person,
  CalendarToday,
  Flag,
  Assignment,
  FilterList,
  ViewModule,
  ViewList,
  FolderOpen,
  Description
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { getTaskProgress, getProgressColor } from '../../utils/taskProgress';

const Tasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Load saved filters and view settings from localStorage
  const loadSavedFilters = () => {
    try {
      const savedFilters = localStorage.getItem('taskFilters');
      const savedTab = localStorage.getItem('taskActiveTab');
      const savedViewMode = localStorage.getItem('taskViewMode');
      
      return {
        filters: savedFilters ? JSON.parse(savedFilters) : {
          status: '',
          priority: '',
          assignee: '',
          project: '',
          timeFilter: '',
          myTasks: false
        },
        activeTab: savedTab ? parseInt(savedTab, 10) : 0,
        viewMode: savedViewMode || 'cards'
      };
    } catch (error) {
      console.error('Error loading saved filters:', error);
      return {
        filters: {
          status: '',
          priority: '',
          assignee: '',
          project: '',
          timeFilter: '',
          myTasks: false
        },
        activeTab: 0,
        viewMode: 'cards'
      };
    }
  };

  const savedSettings = loadSavedFilters();
  const [activeTab, setActiveTab] = useState(savedSettings.activeTab);
  const [viewMode, setViewMode] = useState(savedSettings.viewMode);
  const [filters, setFilters] = useState(savedSettings.filters);

  // Function to generate consistent colors for users
  const getUserColor = (userId) => {
    const colors = [
      '#2563eb', // Vibrant Blue (changed from red)
      '#ea580c', // Vibrant Orange  
      '#16a34a', // Vibrant Green
      '#9333ea'  // Vibrant Purple
    ];
    
    if (!userId) {
      return colors[0];
    }
    
    // Use a more sophisticated approach that ensures better distribution
    // Convert the userId string into a number in a way that creates more variation
    let hash = 0;
    
    // Use the entire string but with a better algorithm
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      // Use a combination of bit shifting and addition for better distribution
      hash = ((hash << 5) - hash + char) & 0xffffffff; // Keep it 32-bit
    }
    
    // Additional mixing to ensure better distribution
    hash = hash ^ (hash >>> 16);
    hash = hash * 0x85ebca6b;
    hash = hash ^ (hash >>> 13);
    hash = hash * 0xc2b2ae35;
    hash = hash ^ (hash >>> 16);
    
    // Use absolute value and modulo to get index
    const colorIndex = Math.abs(hash) % colors.length;
    
    return colors[colorIndex];
  };

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    type: 'task',
    assignee: '',
    dueDate: null,
    estimatedHours: '',
    tags: ''
  });

  // Local inputs for per-task time logging on cards
  const [timeInputs, setTimeInputs] = useState({}); // { [taskId]: { hours: '', minutes: '' } }

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Review', value: 'review' },
    { label: 'Testing', value: 'testing' },
    { label: 'Done', value: 'done' }
  ];

  // derive counts for tabs from current tasks dataset
  const tabCounts = React.useMemo(() => {
    const counts = { '': tasks.length, todo: 0, 'in-progress': 0, review: 0, testing: 0, done: 0 };
    tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return counts;
  }, [tasks]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user, filters]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('taskFilters', JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }, [filters]);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('taskActiveTab', activeTab.toString());
    } catch (error) {
      console.error('Error saving activeTab:', error);
    }
  }, [activeTab]);

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('taskViewMode', viewMode);
    } catch (error) {
      console.error('Error saving viewMode:', error);
    }
  }, [viewMode]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          // Handle boolean values for myTasks
          if (typeof value === 'boolean') {
            params.append(key, value.toString());
          } else {
            params.append(key, value);
          }
        }
      });
      
      const response = await axios.get(`/tasks?${params.toString()}`);
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Handlers for time logging on task cards
  const updateTimeInput = (taskId, field, value) => {
    setTimeInputs(prev => ({
      ...prev,
      [taskId]: { ...(prev[taskId] || {}), [field]: value.replace(/[^0-9]/g, '') }
    }));
  };

  const handleLogTime = async (taskId) => {
    const inputs = timeInputs[taskId] || { hours: '0', minutes: '0' };
    const hours = parseInt(inputs.hours || '0', 10) || 0;
    const minutes = parseInt(inputs.minutes || '0', 10) || 0;
    if (hours <= 0 && minutes <= 0) {
      toast.info('Enter hours or minutes');
      return;
    }
    if (minutes < 0 || minutes > 59) {
      toast.error('Minutes must be between 0 and 59');
      return;
    }
    try {
      await axios.post(`/tasks/${taskId}/time`, { hours, minutes });
      toast.success('Time logged');
      // Clear inputs and refresh
      setTimeInputs(prev => ({ ...prev, [taskId]: { hours: '', minutes: '' } }));
      fetchTasks();
    } catch (error) {
      const apiMsg = error?.response?.data?.message;
      const valMsg = error?.response?.data?.errors?.[0]?.msg;
      toast.error(apiMsg || valMsg || 'Failed to log time');
    }
  };

  // REMOVED: Auto-open edit dialog - was triggering redirect blocker
  // useEffect(() => {
  //   const params = new URLSearchParams(location.search);
  //   const editId = params.get('edit');
  //   if (!editId || !tasks || tasks.length === 0) return;
  //   const taskToEdit = tasks.find(t => (t._id === editId));
  //   if (taskToEdit) {
  //     openEditTask(taskToEdit);
  //   }
  // }, [location.search, tasks]);

  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    type: 'task',
    assignee: '',
    dueDate: null,
    estimatedHours: '',
    tags: ''
  });

  const openEditTask = (task) => {
    setSelectedTask(task);
    setEditTask({
      title: task.title || '',
      description: task.description || '',
      project: task.project?._id || task.project || '',
      priority: task.priority || 'medium',
      type: task.type || 'task',
      assignee: task.assignee?._id || task.assignee || '',
      dueDate: task.dueDate ? dayjs(task.dueDate) : null,
      estimatedHours: task.estimatedHours || '',
      tags: (task.tags || []).join(', ')
    });
    setEditDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    try {
      if (!selectedTask) return;
      const payload = {
        ...editTask,
        dueDate: editTask.dueDate ? editTask.dueDate.toISOString() : null,
        estimatedHours: parseFloat(editTask.estimatedHours) || 0,
        tags: editTask.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await axios.put(`/tasks/${selectedTask._id}`, payload);
      toast.success('Task updated successfully');
      setEditDialogOpen(false);
      setMenuAnchorEl(null);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      // Normalize due date (supports Date, Dayjs, or string)
      let dueISO = null;
      if (newTask.dueDate) {
        const d = newTask.dueDate;
        if (typeof d?.toISOString === 'function') {
          dueISO = d.toISOString();
        } else if (d?.$d) {
          // Dayjs instance
          dueISO = new Date(d.$d).toISOString();
        } else {
          const parsed = new Date(d);
          dueISO = isNaN(parsed.getTime()) ? null : parsed.toISOString();
        }
      }

      const taskData = {
        ...newTask,
        dueDate: dueISO,
        estimatedHours: parseFloat(newTask.estimatedHours) || 0,
        tags: (newTask.tags || '').split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await axios.post('/tasks', taskData);
      toast.success('Task created successfully');
      setCreateDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        project: '',
        priority: 'medium',
        type: 'task',
        assignee: '',
        dueDate: null,
        estimatedHours: '',
        tags: ''
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      const apiMsg = error?.response?.data?.message;
      const valMsg = error?.response?.data?.errors?.[0]?.msg;
      toast.error(apiMsg || valMsg || 'Failed to create task');
    }
  };

  const handleMenuOpen = (event, task) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTask(null);
  };

  const handleDeleteTask = async () => {
    try {
      if (!selectedTask) return;
      await axios.delete(`/tasks/${selectedTask._id}`);
      toast.success('Task archived successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error archiving task:', error);
      toast.error('Failed to archive task');
    }
    handleMenuClose();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setFilters({ ...filters, status: statusTabs[newValue].value });
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: '#f44336',
      'in-progress': '#ff9800',
      review: '#2196f3',
      testing: '#9c27b0',
      done: '#4caf50'
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

  const getTypeIcon = (type) => {
    const icons = {
      feature: '🚀',
      bug: '🐛',
      improvement: '⚡',
      task: '📋',
      story: '📖'
    };
    return icons[type] || '📋';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'done') return false;
    return new Date(dueDate) < new Date();
  };

  const isCompleted = (status, progress) => {
    return status === 'done' || progress === 100;
  };

  const getCardBorder = (task) => {
    const progress = getTaskProgress(task.status);
    if (isCompleted(task.status, progress)) {
      return '2px solid #4caf50'; // Green for completed
    }
    if (isOverdue(task.dueDate, task.status)) {
      return '2px solid #f44336'; // Red for overdue
    }
    return 'none'; // No border for normal tasks
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Tasks
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant={isSmallScreen ? "h5" : "h4"} gutterBottom sx={{ color: 'white', mb: 0 }}>
            Tasks
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Description />}
              onClick={() => navigate('/documents')}
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {isSmallScreen ? "Docs" : "View Documents"}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
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
              {isSmallScreen ? "New" : "New Task"}
            </Button>
          </Box>
        </Box>

        {/* Status Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 999, px: 1, py: 0.75, backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
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
            {statusTabs.map((tab, index) => {
              const v = tab.value;
              const count = tabCounts[v];
              const colorMap = { '': '#9ca3af', todo: '#ef4444', 'in-progress': '#f59e0b', review: '#3b82f6', testing: '#8b5cf6', done: '#10b981' };
              const isSelected = activeTab === index;
              return (
                <Tab
                  key={index}
                  disableRipple
                  sx={{
                    borderRadius: 999,
                    px: 2.25,
                    mx: 0.25,
                    border: `1.5px solid ${isSelected ? colorMap[v] : 'rgba(255,255,255,0.25)'}`,
                    boxShadow: isSelected ? '0 6px 16px rgba(0,0,0,0.15)' : 'none',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)'
                  }}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colorMap[v] || 'rgba(255,255,255,0.7)' }} />
                      <span style={{ fontWeight: 700 }}>{tab.label}</span>
                      <Chip
                        size="small"
                        label={count ?? 0}
                        sx={{
                          ml: 0.5,
                          height: 20,
                          color: isSelected ? '#111827' : '#374151',
                          bgcolor: isSelected ? 'rgba(17,24,39,0.08)' : 'rgba(17,24,39,0.06)',
                          fontWeight: 700
                        }}
                      />
                    </Box>
                  }
                />
              );
            })}
          </Tabs>
        </Paper>

        {/* Filters */}
        <Paper sx={{ p: { xs: 1, sm: 1.5 }, mb: 3, borderRadius: 3, backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <Grid container spacing={{ xs: 1, sm: 1.5 }}>
          <Grid item xs={6} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <Select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                displayEmpty
                inputProps={{ 'aria-label': 'Priority filter' }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <span style={{ color: '#9ca3af', fontSize: isSmallScreen ? '12px' : '14px', fontWeight: 500 }}>Priority</span>;
                  }
                  const map = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
                  return <span style={{ fontSize: isSmallScreen ? '12px' : '14px', fontWeight: 500 }}>{map[selected] || 'Priority'}</span>;
                }}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.98)',
                  borderRadius: 2,
                  '& fieldset': { border: 'none' },
                  color: '#111827',
                  fontSize: isSmallScreen ? '12px' : '14px',
                  fontWeight: 500,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                  '& .MuiSelect-icon': { color: '#6b7280' }
                }}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <Select
                value={filters.project}
                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                displayEmpty
                inputProps={{ 'aria-label': 'Project filter' }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <span style={{ color: '#9ca3af', fontSize: isSmallScreen ? '12px' : '14px', fontWeight: 500 }}>Project</span>;
                  }
                  const p = projects.find(pr => pr._id === selected);
                  return <span style={{ fontSize: isSmallScreen ? '12px' : '14px', fontWeight: 500 }}>{p?.name || 'Project'}</span>;
                }}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.98)',
                  borderRadius: 2,
                  '& fieldset': { border: 'none' },
                  color: '#111827',
                  fontSize: isSmallScreen ? '12px' : '14px',
                  fontWeight: 500,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                  '& .MuiSelect-icon': { color: '#6b7280' }
                }}
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {users.length > 0 && (
            <Grid item xs={6} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.assignee}
                  onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Assignee filter' }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#9ca3af', fontSize: isSmallScreen ? '12px' : '14px', fontWeight: 500 }}>Assignee</span>;
                    }
                    const u = users.find(us => us._id === selected);
                    return <span style={{ fontSize: isSmallScreen ? '12px' : '14px', fontWeight: 500 }}>{u?.name || 'Assignee'}</span>;
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.98)',
                    borderRadius: 2,
                    '& fieldset': { border: 'none' },
                    color: '#111827',
                    fontSize: isSmallScreen ? '12px' : '14px',
                    fontWeight: 500,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                    '& .MuiSelect-icon': { color: '#6b7280' }
                  }}
                >
                  <MenuItem value="">All Assignees</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={6} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <Select
                value={filters.timeFilter}
                onChange={(e) => setFilters({ ...filters, timeFilter: e.target.value })}
                displayEmpty
                inputProps={{ 'aria-label': 'Time filter' }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <span style={{ color: '#9ca3af', fontSize: isSmallScreen ? '12px' : '14px', fontWeight: 500 }}>Time Filter</span>;
                  }
                  const map = { 
                    'this-month': 'This Month', 
                    'last-month': 'Last Month',
                    'last-3-months': 'Last 3 Months',
                    'this-year': 'This Year'
                  };
                  return <span style={{ fontSize: isSmallScreen ? '12px' : '14px', fontWeight: 500 }}>{map[selected] || 'Time Filter'}</span>;
                }}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.98)',
                  borderRadius: 2,
                  '& fieldset': { border: 'none' },
                  color: '#111827',
                  fontSize: isSmallScreen ? '12px' : '14px',
                  fontWeight: 500,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                  '& .MuiSelect-icon': { color: '#6b7280' }
                }}
              >
                <MenuItem value="">All Time</MenuItem>
                <MenuItem value="this-month">This Month</MenuItem>
                <MenuItem value="last-month">Last Month</MenuItem>
                <MenuItem value="last-3-months">Last 3 Months</MenuItem>
                <MenuItem value="this-year">This Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* My Tasks checkbox - only for standard users */}
          {user?.role !== 'admin' && (
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.myTasks}
                    onChange={(e) => setFilters({ ...filters, myTasks: e.target.checked })}
                    sx={{
                      color: '#6b7280',
                      '&.Mui-checked': {
                        color: '#3b82f6'
                      }
                    }}
                  />
                }
                label={
                  <Typography sx={{ 
                    fontSize: isSmallScreen ? '12px' : '14px', 
                    fontWeight: 500, 
                    color: '#111827' 
                  }}>
                    My Tasks
                  </Typography>
                }
                sx={{
                  bgcolor: 'rgba(255,255,255,0.98)',
                  borderRadius: 2,
                  px: isSmallScreen ? 1 : 1.5,
                  py: 0.5,
                  border: 'none',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                  height: '40px',
                  margin: 0,
                  width: '100%',
                  justifyContent: 'flex-start',
                  '& .MuiFormControlLabel-label': {
                    fontSize: '14px',
                    fontWeight: 500
                  }
                }}
              />
            </Grid>
          )}
          </Grid>
        </Paper>

        {/* View Mode Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment sx={{ color: 'white', fontSize: isSmallScreen ? '1.2rem' : '1.5rem' }} />
            <Typography variant={isSmallScreen ? "subtitle1" : "h6"} sx={{ fontWeight: 600, color: 'white' }}>
              {tasks.length}
            </Typography>
          </Box>
          <ToggleButtonGroup
            size={isSmallScreen ? "small" : "medium"}
            value={viewMode}
            exclusive
            onChange={(e, val) => { if (val) setViewMode(val); }}
            sx={{
              '& .MuiToggleButton-root': {
                px: isSmallScreen ? 1 : 1.5
              }
            }}
          >
            <ToggleButton value="cards" aria-label="card view">
              <ViewModule fontSize="small" />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ViewList fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {viewMode === 'cards' ? (
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {tasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={task._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  border: getCardBorder(task),
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
                onClick={() => navigate(`/tasks/${task._id}`)}
              >
                <CardContent sx={{ flexGrow: 1, position: 'relative', p: { xs: 1.5, sm: 2 }, pb: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, task);
                    }}
                    sx={{ 
                      position: 'absolute', 
                      top: { xs: 2, sm: 4 }, 
                      right: { xs: 2, sm: 4 },
                      padding: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <MoreVert fontSize={isSmallScreen ? "small" : "medium"} />
                  </IconButton>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, pr: { xs: 3, sm: 4 } }}>
                    <Typography variant="body2" component="span" sx={{ mr: 1, fontSize: { xs: '14px', sm: '16px' } }}>
                      {getTypeIcon(task.type)}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      component="div"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.15rem' },
                        lineHeight: 1.3,
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word'
                      }}
                    >
                      {task.title}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: { xs: 0.3, sm: 0.5 }, mb: { xs: 1, sm: 1.5 }, flexWrap: 'wrap' }}>
                    <Chip
                      label={task.status.replace('-', ' ')}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(task.status),
                        color: 'white',
                        fontSize: { xs: '0.55rem', sm: '0.7rem' },
                        height: { xs: 16, sm: 20 }
                      }}
                    />
                    <Chip
                      label={task.priority}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(task.priority),
                        color: 'white',
                        fontSize: { xs: '0.55rem', sm: '0.7rem' },
                        height: { xs: 16, sm: 20 }
                      }}
                    />
                    <Chip
                      label={task.type}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: { xs: '0.55rem', sm: '0.7rem' },
                        height: { xs: 16, sm: 20 }
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: { xs: 0.5, sm: 1 } }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                      <FolderOpen sx={{ fontSize: { xs: 12, sm: 14 }, mr: 0.5, color: '#3b82f6' }} />
                      {task.project?.name}
                    </Typography>
                  </Box>

                  {task.assignee && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: { xs: 0.5, sm: 1 } }}>
                      <Person sx={{ fontSize: { xs: 12, sm: 14 }, color: 'text.secondary' }} />
                      <Avatar 
                        sx={{ 
                          width: { xs: 20, sm: 24 }, 
                          height: { xs: 20, sm: 24 }, 
                          fontSize: { xs: '0.6rem', sm: '0.75rem' },
                          fontWeight: 600,
                          bgcolor: getUserColor(task.assignee._id),
                          color: 'white',
                          border: '2px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Chip
                        label={task.assignee.name}
                        size="small"
                        sx={{
                          bgcolor: getUserColor(task.assignee._id),
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          height: 24,
                          '& .MuiChip-label': {
                            px: 1.5
                          }
                        }}
                      />
                    </Box>
                  )}

                  {task.dueDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <CalendarToday sx={{ fontSize: 14, color: isOverdue(task.dueDate, task.status) ? 'error.main' : 'text.secondary' }} />
                      <Typography 
                        variant="body2" 
                        color={isOverdue(task.dueDate, task.status) ? 'error.main' : 'text.secondary'}
                        sx={{ fontSize: '0.8rem' }}
                      >
                        Due: {formatDate(task.dueDate)}
                        {isOverdue(task.dueDate, task.status) && ' (Overdue)'}
                      </Typography>
                    </Box>
                  )}

                  {task.estimatedHours > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 1 }}>
                      Estimated: {task.estimatedHours}h
                    </Typography>
                  )}

                  {/* Time tracker on card */}
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Logged: {task.actualHours ? task.actualHours.toFixed(2) : 0}h
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }} onClick={(e) => e.stopPropagation()}>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="H"
                        value={(timeInputs[task._id]?.hours) ?? ''}
                        onChange={(e) => updateTimeInput(task._id, 'hours', e.target.value)}
                        sx={{ 
                          width: 44,
                          '& .MuiInputBase-input': { 
                            fontSize: '0.8rem',
                            p: '4px 6px'
                          }
                        }}
                        inputProps={{ min: 0 }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        placeholder="M"
                        value={(timeInputs[task._id]?.minutes) ?? ''}
                        onChange={(e) => updateTimeInput(task._id, 'minutes', e.target.value)}
                        sx={{ 
                          width: 44,
                          '& .MuiInputBase-input': { 
                            fontSize: '0.8rem',
                            p: '4px 6px'
                          }
                        }}
                        inputProps={{ min: 0, max: 59 }}
                      />
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={(e) => { e.stopPropagation(); handleLogTime(task._id); }}
                        sx={{ 
                          fontSize: '0.7rem',
                          px: 1,
                          py: 0.25,
                          minWidth: 'auto'
                        }}
                      >
                        Log
                      </Button>
                    </Box>
                  </Box>

                  {/* Progress Bar */}
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Progress
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight="medium" sx={{ fontSize: '0.7rem' }}>
                        {getTaskProgress(task.status)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={getTaskProgress(task.status)} 
                      sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        bgcolor: 'rgba(0, 0, 0, 0.05)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getProgressColor(task.status),
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 1, pt: 0 }}>
                  <Button 
                    size="small" 
                    startIcon={<Edit />} 
                    onClick={(e) => { e.stopPropagation(); openEditTask(task); }}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Edit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 0, overflowX: 'auto' }}>
            <Table size={isSmallScreen ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: isSmallScreen ? '0.75rem' : 'inherit', minWidth: isSmallScreen ? 120 : 'auto' }}>Task</TableCell>
                  <TableCell sx={{ fontSize: isSmallScreen ? '0.75rem' : 'inherit', minWidth: isSmallScreen ? 80 : 'auto' }}>Status</TableCell>
                  {!isSmallScreen && <TableCell sx={{ fontSize: isSmallScreen ? '0.75rem' : 'inherit' }}>Due Date</TableCell>}
                  <TableCell sx={{ fontSize: isSmallScreen ? '0.75rem' : 'inherit', minWidth: isSmallScreen ? 100 : 'auto' }}>Assigned To</TableCell>
                  {!isSmallScreen && <TableCell align="right" sx={{ fontSize: isSmallScreen ? '0.75rem' : 'inherit' }}>Logged (h)</TableCell>}
                  {!isSmallScreen && <TableCell align="right" sx={{ fontSize: isSmallScreen ? '0.75rem' : 'inherit' }}>Estimated (h)</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks/${task._id}`)}>
                    <TableCell>
                      <Box>
                        <Typography variant={isSmallScreen ? "caption" : "body2"} sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {isSmallScreen ? task.title.substring(0, 30) + (task.title.length > 30 ? '...' : '') : task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: isSmallScreen ? '0.6rem' : 'inherit' }}>
                          {isSmallScreen ? (task.project?.name || '—').substring(0, 15) + ((task.project?.name || '').length > 15 ? '...' : '') : (task.project?.name || '—')}
                        </Typography>
                        {isSmallScreen && task.dueDate && (
                          <Typography variant="caption" color={isOverdue(task.dueDate, task.status) ? 'error.main' : 'text.secondary'} sx={{ display: 'block', fontSize: '0.6rem' }}>
                            Due: {formatDate(task.dueDate)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.status?.replace('-', ' ') || '—'}
                        size="small"
                        sx={{ 
                          bgcolor: getStatusColor(task.status), 
                          color: 'white',
                          fontSize: isSmallScreen ? '0.6rem' : 'inherit',
                          height: isSmallScreen ? 18 : 'auto'
                        }}
                      />
                    </TableCell>
                    {!isSmallScreen && (
                      <TableCell>
                        {task.dueDate ? (
                          <Typography variant="body2" color={isOverdue(task.dueDate, task.status) ? 'error.main' : 'text.secondary'}>
                            {formatDate(task.dueDate)}
                            {isOverdue(task.dueDate, task.status) && ' (Overdue)'}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: isSmallScreen ? 0.5 : 1 }}>
                        <Avatar 
                          sx={{ 
                            width: isSmallScreen ? 24 : 28, 
                            height: isSmallScreen ? 24 : 28,
                            fontSize: isSmallScreen ? '0.6rem' : '0.8rem',
                            fontWeight: 600,
                            bgcolor: task.assignee ? getUserColor(task.assignee._id) : '#9e9e9e',
                            color: 'white',
                            border: '2px solid rgba(255,255,255,0.2)'
                          }}
                        >
                          {task.assignee?.name ? task.assignee.name[0].toUpperCase() : '?'}
                        </Avatar>
                        {task.assignee ? (
                          isSmallScreen ? (
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                              {task.assignee.name.split(' ')[0]}
                            </Typography>
                          ) : (
                            <Chip
                              label={task.assignee.name}
                              size="small"
                              sx={{
                                bgcolor: getUserColor(task.assignee._id),
                                color: 'white',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                height: 28,
                                '& .MuiChip-label': {
                                  px: 1.5
                                }
                              }}
                            />
                          )
                        ) : (
                          <Typography variant={isSmallScreen ? "caption" : "body2"} color="text.secondary" sx={{ fontSize: isSmallScreen ? '0.7rem' : 'inherit' }}>
                            {isSmallScreen ? 'None' : 'Unassigned'}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    {!isSmallScreen && <TableCell align="right">{task.actualHours ? task.actualHours.toFixed(2) : '0.00'}</TableCell>}
                    {!isSmallScreen && <TableCell align="right">{task.estimatedHours ? Number(task.estimatedHours).toFixed(2) : '0.00'}</TableCell>}
                  </TableRow>
                ))}
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isSmallScreen ? 3 : 6} align="center">No tasks found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {tasks.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No tasks found
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Create Your First Task
            </Button>
          </Box>
        )}

        {/* Task Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { const t = selectedTask; handleMenuClose(); if (t) openEditTask(t); }}>
            <Edit sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDeleteTask}>
            <Delete sx={{ mr: 1 }} />
            Archive
          </MenuItem>
        </Menu>

        {/* Create Task Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isSmallScreen}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              Create New Task
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={isSmallScreen ? 4 : 9}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  required
                  sx={{
                    '& .MuiInputBase-root': {
                      maxHeight: isSmallScreen ? '120px' : '240px',
                      overflow: 'auto'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={newTask.project}
                    label="Project"
                    onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project._id} value={project._id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newTask.type}
                    label="Type"
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                  >
                    <MenuItem value="feature">Feature</MenuItem>
                    <MenuItem value="bug">Bug</MenuItem>
                    <MenuItem value="improvement">Improvement</MenuItem>
                    <MenuItem value="task">Task</MenuItem>
                    <MenuItem value="story">Story</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newTask.priority}
                    label="Priority"
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assignee</InputLabel>
                  <Select
                    value={newTask.assignee}
                    label="Assignee"
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Due Date"
                  value={newTask.dueDate}
                  onChange={(date) => setNewTask({ ...newTask, dueDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Hours"
                  type="number"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags (comma separated)"
                  value={newTask.tags}
                  onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                  placeholder="frontend, urgent, feature"
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateTask}
                disabled={!newTask.title || !newTask.description || !newTask.project}
              >
                Create Task
              </Button>
            </Box>
          </Box>
        </Dialog>

        {/* Edit Task Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isSmallScreen}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              Edit Task
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title"
                  value={editTask.title}
                  onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={9}
                  value={editTask.description}
                  onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                  required
                  sx={{
                    '& .MuiInputBase-root': {
                      maxHeight: '240px',
                      overflow: 'auto'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={editTask.project}
                    label="Project"
                    onChange={(e) => setEditTask({ ...editTask, project: e.target.value })}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project._id} value={project._id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={editTask.type}
                    label="Type"
                    onChange={(e) => setEditTask({ ...editTask, type: e.target.value })}
                  >
                    <MenuItem value="feature">Feature</MenuItem>
                    <MenuItem value="bug">Bug</MenuItem>
                    <MenuItem value="improvement">Improvement</MenuItem>
                    <MenuItem value="task">Task</MenuItem>
                    <MenuItem value="story">Story</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={editTask.priority}
                    label="Priority"
                    onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assignee</InputLabel>
                  <Select
                    value={editTask.assignee}
                    label="Assignee"
                    onChange={(e) => setEditTask({ ...editTask, assignee: e.target.value })}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Due Date"
                  value={editTask.dueDate}
                  onChange={(date) => setEditTask({ ...editTask, dueDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Hours"
                  type="number"
                  value={editTask.estimatedHours}
                  onChange={(e) => setEditTask({ ...editTask, estimatedHours: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags (comma separated)"
                  value={editTask.tags}
                  onChange={(e) => setEditTask({ ...editTask, tags: e.target.value })}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleUpdateTask} disabled={!editTask.title || !editTask.description || !editTask.project}>Save Changes</Button>
            </Box>
          </Box>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Tasks;
