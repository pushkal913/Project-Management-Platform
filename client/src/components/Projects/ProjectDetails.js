import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  TextField
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  People,
  Assignment,
  CalendarToday,
  AttachMoney,
  TrendingUp,
  Add
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import StatusPill from './StatusPill';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinProject, leaveProject } = useSocket();
  const [project, setProject] = useState(null);
  const [taskStats, setTaskStats] = useState({});
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [users, setUsers] = useState([]);

  // New task state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    type: 'task',
    assignee: '',
    dueDate: null,
    estimatedHours: '',
    tags: ''
  });

  useEffect(() => {
    fetchProjectDetails();
    if (user?.role === 'admin') {
      fetchUsers();
    }
    
    if (id) {
      joinProject(id);
    }

    return () => {
      if (id) {
        leaveProject(id);
      }
    };
  }, [id, user]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/projects/${id}`);
      setProject(response.data.project);
      setTaskStats(response.data.taskStats);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to fetch project details');
      // Don't auto-navigate on error - let user decide
      // navigate('/projects');
    } finally {
      setLoading(false);
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
      // Auto-assign to current user if they're a standard user
      const assigneeId = user?.role === 'admin' && newTask.assignee ? newTask.assignee : 
                          user?.role !== 'admin' ? user._id : newTask.assignee;

      const taskData = {
        ...newTask,
        project: id, // Auto-assign to current project
        assignee: assigneeId,
        dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
        estimatedHours: parseFloat(newTask.estimatedHours) || 0,
        tags: (newTask.tags || '').split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await axios.post('/tasks', taskData);
      
      const assigneeText = user?.role !== 'admin' ? ' and assigned to you' : 
                          assigneeId ? ` and assigned to ${users.find(u => u._id === assigneeId)?.name || 'user'}` : '';
      
      toast.success(`Task created successfully${assigneeText}!`);
      setCreateTaskDialogOpen(false);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        type: 'task',
        assignee: '',
        dueDate: null,
        estimatedHours: '',
        tags: ''
      });
      
      // Refresh project details to update task count and list
      fetchProjectDetails();
    } catch (error) {
      console.error('Error creating task:', error);
      const apiMsg = error?.response?.data?.message;
      const valMsg = error?.response?.data?.errors?.[0]?.msg;
      toast.error(apiMsg || valMsg || 'Failed to create task');
    }
  };

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;
    try {
      const response = await axios.put(`/projects/${id}`, { status: newStatus });
      setProject(response.data.project);
      toast.success('Project status updated successfully!');
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: '#757575',
      active: '#4caf50',
      'on-hold': '#ff9800',
      completed: '#2196f3',
      archived: '#f44336'
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
        <LinearProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Project not found</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/projects')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {project.name}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateTaskDialogOpen(true)}
            sx={{ ml: 2 }}
          >
            New Task
          </Button>
        </Box>

      <Grid container spacing={3}>
        {/* Project Overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                Project Overview
              </Typography>
              <Tooltip title="Edit project">
                <IconButton size="small" onClick={() => navigate(`/projects?edit=${id}`)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {project.description}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <Chip
                label={project.priority}
                sx={{
                  bgcolor: getPriorityColor(project.priority),
                  color: 'white'
                }}
              />
            </Box>


            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(project.startDate)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(project.endDate)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              {project.budget > 0 && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoney sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Budget
                      </Typography>
                      <Typography variant="body1">
                        ${project.budget.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Task Statistics */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={2.4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="error">
                      {taskStats.todo || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      To Do
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="warning.main">
                      {taskStats['in-progress'] || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="info.main">
                      {taskStats.review || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Review
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="secondary.main">
                      {taskStats.testing || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Testing
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="success.main">
                      {taskStats.done || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Done
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Related Tasks */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tasks
            </Typography>
            {tasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tasks for this project yet.
              </Typography>
            ) : (
              <List>
                {tasks.map((t) => (
                  <ListItem
                    key={t._id}
                    divider
                    button
                    onClick={() => navigate(`/tasks/${t._id}`)}
                    sx={{ alignItems: 'flex-start' }}
                  >
                    <ListItemAvatar>
                      <Avatar>{(t.assignee?.name || 'T').charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" sx={{ mr: 1 }}>
                            {t.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={t.status?.replace('-', ' ') || 'unknown'}
                            sx={{
                              bgcolor: (t.status === 'done' && 'success.main') ||
                                      (t.status === 'in-progress' && 'warning.main') ||
                                      (t.status === 'review' && 'info.main') ||
                                      (t.status === 'testing' && 'secondary.main') ||
                                      'error.main',
                              color: 'white'
                            }}
                          />
                          {t.dueDate && (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`Due: ${new Date(t.dueDate).toLocaleDateString()}`}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {(t.description || '').length > 140
                            ? `${t.description.substring(0, 140)}...`
                            : (t.description || 'No description')}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Status Editor */}
          <Box sx={{ mb: 3 }}>
            <StatusPill 
              status={project.status} 
              onStatusChange={handleStatusChange} 
              getStatusColor={getStatusColor} 
            />
          </Box>
          
          {/* Project Manager */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Manager
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar>
                {project.manager.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {project.manager.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {project.manager.email}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Team Members */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Team Members ({project.team?.length || 0})
            </Typography>
            {project.team && project.team.length > 0 ? (
              <List dense>
                {project.team.map((member, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {member.user.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.user.name}
                      secondary={member.user.email}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No team members assigned
              </Typography>
            )}
          </Paper>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {project.tags.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Create Task Dialog */}
      <Dialog
        open={createTaskDialogOpen}
        onClose={() => setCreateTaskDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create New Task in {project?.name}
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
                rows={9}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
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
            {user?.role === 'admin' && users.length > 0 && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assignee</InputLabel>
                  <Select
                    value={newTask.assignee}
                    label="Assignee"
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {users.map((u) => (
                      <MenuItem key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {user?.role !== 'admin' && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="info.dark">
                    💡 This task will be automatically assigned to you ({user?.name})
                  </Typography>
                </Box>
              </Grid>
            )}
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
            <Button onClick={() => setCreateTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateTask}
              disabled={!newTask.title || !newTask.description}
            >
              Create Task
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
};

export default ProjectDetails;
