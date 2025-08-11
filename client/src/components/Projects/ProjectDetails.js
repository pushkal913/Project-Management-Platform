import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  Button,
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
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  People,
  Assignment,
  CalendarToday,
  AttachMoney,
  TrendingUp
} from '@mui/icons-material';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-toastify';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { joinProject, leaveProject } = useSocket();
  const [project, setProject] = useState(null);
  const [taskStats, setTaskStats] = useState({});
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetails();
    
    // Join project room for real-time updates
    if (id) {
      joinProject(id);
    }

    // Cleanup on unmount
    return () => {
      if (id) {
        leaveProject(id);
      }
    };
  }, [id]);

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
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
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
          startIcon={<Edit />}
          onClick={() => navigate(`/projects?edit=${id}`)}
          sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#f7f7f7' } }}
        >
          Edit Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Project Overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Overview
            </Typography>
            <Typography variant="body1" paragraph>
              {project.description}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <Chip
                label={project.status}
                sx={{
                  bgcolor: getStatusColor(project.status),
                  color: 'white'
                }}
              />
              <Chip
                label={project.priority}
                sx={{
                  bgcolor: getPriorityColor(project.priority),
                  color: 'white'
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress: {project.progress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={project.progress} 
                sx={{ height: 10, borderRadius: 5 }}
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
    </Box>
  );
};

export default ProjectDetails;
