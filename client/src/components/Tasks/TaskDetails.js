import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Avatar,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Tooltip,
  Dialog
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Person,
  Assignment,
  CalendarToday,
  Flag,
  Schedule,
  Comment,
  Add,
  Check,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getTaskProgress, getProgressColor } from '../../utils/taskProgress';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [timeHours, setTimeHours] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  
  // Task navigation state
  const [taskList, setTaskList] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
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

  useEffect(() => {
    fetchTaskDetails();
    fetchProjects();
    fetchUsers();
    loadTaskList();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/tasks/${id}`);
      setTask(response.data.task);
    } catch (error) {
      console.error('Error fetching task details:', error);
      toast.error('Failed to fetch task details');
      // Don't auto-navigate on error - let user decide
      // navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Load task list from localStorage (saved from Tasks page)
  const loadTaskList = () => {
    try {
      const savedTaskList = localStorage.getItem('currentTaskList');
      if (savedTaskList) {
        const tasks = JSON.parse(savedTaskList);
        setTaskList(tasks);
        const index = tasks.findIndex(t => t._id === id);
        setCurrentTaskIndex(index);
      }
    } catch (error) {
      console.error('Error loading task list:', error);
    }
  };

  // Navigate to previous task
  const goToPreviousTask = () => {
    if (currentTaskIndex > 0 && taskList.length > 0) {
      const previousTask = taskList[currentTaskIndex - 1];
      navigate(`/tasks/${previousTask._id}`);
    }
  };

  // Navigate to next task
  const goToNextTask = () => {
    if (currentTaskIndex < taskList.length - 1 && taskList.length > 0) {
      const nextTask = taskList[currentTaskIndex + 1];
      navigate(`/tasks/${nextTask._id}`);
    }
  };

  const openEditTask = () => {
    if (!task) return;
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
      const payload = {
        ...editTask,
        dueDate: editTask.dueDate ? editTask.dueDate.toISOString() : null,
        estimatedHours: parseFloat(editTask.estimatedHours) || 0,
        tags: editTask.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await axios.put(`/tasks/${id}`, payload);
      toast.success('Task updated successfully');
      setEditDialogOpen(false);
      fetchTaskDetails(); // Refresh task data
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleLogTime = async () => {
    const hours = parseInt(timeHours || '0', 10) || 0;
    const minutes = parseInt(timeMinutes || '0', 10) || 0;
    if (hours <= 0 && minutes <= 0) {
      toast.info('Enter hours or minutes');
      return;
    }
    if (minutes < 0 || minutes > 59) {
      toast.error('Minutes must be between 0 and 59');
      return;
    }
    try {
      const res = await axios.post(`/tasks/${id}/time`, { hours, minutes });
      setTask(res.data.task);
      setTimeHours('');
      setTimeMinutes('');
      toast.success('Time logged');
    } catch (error) {
      const apiMsg = error?.response?.data?.message;
      const valMsg = error?.response?.data?.errors?.[0]?.msg;
      toast.error(apiMsg || valMsg || 'Failed to log time');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`/tasks/${id}`, { status: newStatus });
      setTask({ ...task, status: newStatus });
      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`/tasks/${id}/comments`, {
        content: newComment
      });
      
      // Add the new comment to the task
      setTask({
        ...task,
        comments: [...task.comments, response.data.comment]
      });
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    try {
      const response = await axios.post(`/tasks/${id}/subtasks`, {
        title: newSubtask
      });
      
      // Add the new subtask to the task
      setTask({
        ...task,
        subtasks: [...task.subtasks, response.data.subtask]
      });
      setNewSubtask('');
      toast.success('Subtask added');
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast.error('Failed to add subtask');
    }
  };

  const handleSubtaskToggle = async (subtaskId, completed) => {
    try {
      await axios.put(`/tasks/${id}/subtasks/${subtaskId}`, {
        completed: !completed
      });
      
      // Update the subtask in the task
      setTask({
        ...task,
        subtasks: task.subtasks.map(subtask =>
          subtask._id === subtaskId
            ? { ...subtask, completed: !completed }
            : subtask
        )
      });
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Failed to update subtask');
    }
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

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Task not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/tasks')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Typography variant="h5">
            {getTypeIcon(task.type)}
          </Typography>
          <Typography variant="h5">
            {task.title}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Task Description */}
          {/* Progress Bar */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Task Progress
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                  {getTaskProgress(task.status)}% Complete
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getTaskProgress(task.status)} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'rgba(0, 0, 0, 0.05)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getProgressColor(task.status),
                    borderRadius: 4
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {task.status.replace('-', ' ').toUpperCase()}
                </Typography>
                <Typography variant="caption" color={getProgressColor(task.status)} fontWeight="medium">
                  {getTaskProgress(task.status)}%
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Task Description */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                Description
              </Typography>
              <Tooltip title="Edit task">
                <IconButton size="small" onClick={openEditTask}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {task.description}
            </Typography>
          </Paper>

          {/* Time Tracking */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Time Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Logged: {task.actualHours ? task.actualHours.toFixed(2) : 0}h
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                label="Hours"
                size="small"
                type="number"
                value={timeHours}
                onChange={(e) => setTimeHours(e.target.value.replace(/[^0-9]/g, ''))}
                sx={{ width: 90 }}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Minutes"
                size="small"
                type="number"
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(e.target.value.replace(/[^0-9]/g, ''))}
                sx={{ width: 90 }}
                inputProps={{ min: 0, max: 59 }}
              />
              <Button variant="contained" onClick={handleLogTime}>
                Add Time
              </Button>
            </Box>

            {/* Logged by user (aggregated) */}
            {task.timeLogs && task.timeLogs.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>By Team Member</Typography>
                {Object.values(
                  task.timeLogs.reduce((acc, log) => {
                    const key = log.user?._id || 'unknown';
                    const add = (log.hours || 0) + (log.minutes || 0) / 60;
                    if (!acc[key]) acc[key] = { user: log.user, total: 0 };
                    acc[key].total += add;
                    return acc;
                  }, {})
                ).map((entry) => (
                  <Box key={entry.user?._id || Math.random()} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {entry.user?.name ? entry.user.name[0] : '?'}
                    </Avatar>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {entry.user?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {entry.total.toFixed(2)}h
                    </Typography>
                  </Box>
                ))}

                {/* Raw log list */}
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Recent Logs</Typography>
                <List dense>
                  {task.timeLogs.slice().reverse().slice(0, 10).map((log, idx) => (
                    <ListItem key={idx} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {log.user?.name ? log.user.name[0] : '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${log.user?.name || 'Unknown'} logged ${(log.hours || 0)}h ${(log.minutes || 0)}m`}
                        secondary={new Date(log.loggedAt).toLocaleString()}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Paper>

          {/* Subtasks */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Subtasks ({task.subtasks?.length || 0})
            </Typography>
            
            {task.subtasks && task.subtasks.length > 0 && (
              <List>
                {task.subtasks.map((subtask) => (
                  <ListItem key={subtask._id} sx={{ px: 0 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={subtask.completed}
                          onChange={() => handleSubtaskToggle(subtask._id, subtask.completed)}
                        />
                      }
                      label={
                        <Typography
                          sx={{
                            textDecoration: subtask.completed ? 'line-through' : 'none',
                            color: subtask.completed ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {subtask.title}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <Button
                variant="outlined"
                onClick={handleAddSubtask}
                disabled={!newSubtask.trim()}
              >
                <Add />
              </Button>
            </Box>
          </Paper>

          {/* Comments */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Comments ({task.comments?.length || 0})
            </Typography>
            
            {task.comments && task.comments.length > 0 && (
              <List>
                {task.comments.map((comment, index) => (
                  <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {comment.user.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {comment.user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(comment.createdAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={comment.content}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                sx={{
                  '& .MuiInputBase-root': {
                    maxHeight: '160px',
                    overflow: 'auto'
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                sx={{ alignSelf: 'flex-start' }}
              >
                <Comment />
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Task Navigation - Compact */}
          {taskList.length > 0 && (
            <Paper sx={{ 
              p: 1, 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <Tooltip title="Previous Task">
                <span>
                  <IconButton 
                    size="small"
                    onClick={goToPreviousTask}
                    disabled={currentTaskIndex <= 0}
                    sx={{ 
                      color: currentTaskIndex <= 0 ? 'rgba(0,0,0,0.26)' : 'primary.main',
                      padding: '6px',
                      '&:hover': {
                        bgcolor: 'rgba(103, 58, 183, 0.08)'
                      }
                    }}
                  >
                    <NavigateBefore fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                {currentTaskIndex + 1} / {taskList.length}
              </Typography>
              <Tooltip title="Next Task">
                <span>
                  <IconButton 
                    size="small"
                    onClick={goToNextTask}
                    disabled={currentTaskIndex >= taskList.length - 1}
                    sx={{ 
                      color: currentTaskIndex >= taskList.length - 1 ? 'rgba(0,0,0,0.26)' : 'primary.main',
                      padding: '6px',
                      '&:hover': {
                        bgcolor: 'rgba(103, 58, 183, 0.08)'
                      }
                    }}
                  >
                    <NavigateNext fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Paper>
          )}
          
          {/* Status */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Status
            </Typography>
            <FormControl fullWidth>
              <Select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <MenuItem value="todo">To Do</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="testing">Testing</MenuItem>
                <MenuItem value="done">Done</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          {/* Task Details */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Details
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Priority
              </Typography>
              <Chip
                label={task.priority}
                size="small"
                sx={{
                  bgcolor: getPriorityColor(task.priority),
                  color: 'white',
                  mt: 0.5
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Type
              </Typography>
              <Chip
                label={task.type}
                size="small"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Project
              </Typography>
              <Typography variant="body1">
                {task.project?.name}
              </Typography>
            </Box>

            {task.assignee && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Assignee
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Avatar sx={{ width: 24, height: 24 }}>
                    {task.assignee.name.charAt(0)}
                  </Avatar>
                  <Typography variant="body1">
                    {task.assignee.name}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Reporter
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Avatar sx={{ width: 24, height: 24 }}>
                  {task.reporter.name.charAt(0)}
                </Avatar>
                <Typography variant="body1">
                  {task.reporter.name}
                </Typography>
              </Box>
            </Box>

            {task.dueDate && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography 
                  variant="body1"
                  color={isOverdue(task.dueDate, task.status) ? 'error.main' : 'text.primary'}
                >
                  {formatDate(task.dueDate)}
                  {isOverdue(task.dueDate, task.status) && ' (Overdue)'}
                </Typography>
              </Box>
            )}

            {task.estimatedHours > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Hours
                </Typography>
                <Typography variant="body1">
                  {task.estimatedHours}h
                </Typography>
              </Box>
            )}

            {task.actualHours > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Actual Hours
                </Typography>
                <Typography variant="body1">
                  {task.actualHours}h
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {task.tags.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Edit Task Dialog */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ p: 3 }}>
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
                  rows={4}
                  value={editTask.description}
                  onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                  required
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
                  placeholder="frontend, urgent, feature"
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleUpdateTask}
                disabled={!editTask.title || !editTask.description || !editTask.project}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Dialog>
      </LocalizationProvider>
    </Box>
  );
};

export default TaskDetails;
