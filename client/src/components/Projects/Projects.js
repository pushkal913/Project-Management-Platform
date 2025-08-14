import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Avatar,
  AvatarGroup,
  Tooltip
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Archive,
  People,
  CalendarToday,
  TrendingUp
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [users, setUsers] = useState([]);
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    startDate: dayjs(),
    endDate: dayjs().add(1, 'month'),
    priority: 'medium',
    budget: '',
    tags: '',
    teamMembers: []
  });

  // New task state for global task creation
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

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/projects');
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const [editProject, setEditProject] = useState({
    name: '',
    description: '',
    startDate: dayjs(),
    endDate: dayjs().add(1, 'month'),
    priority: 'medium',
    budget: '',
    tags: '',
    teamMembers: []
  });

  const openEditProject = (project) => {
    setSelectedProject(project);
    setEditProject({
      name: project.name || '',
      description: project.description || '',
      startDate: project.startDate ? dayjs(project.startDate) : dayjs(),
      endDate: project.endDate ? dayjs(project.endDate) : dayjs().add(1, 'month'),
      priority: project.priority || 'medium',
      budget: project.budget || '',
      tags: (project.tags || []).join(', '),
      teamMembers: (project.team || []).map(tm => tm.user?._id || tm.user).filter(Boolean)
    });
    setEditDialogOpen(true);
  };

  const handleUpdateProject = async () => {
    try {
      if (!selectedProject) return;
      const payload = {
        ...editProject,
        startDate: editProject.startDate.toISOString(),
        endDate: editProject.endDate.toISOString(),
        budget: parseFloat(editProject.budget) || 0,
        tags: editProject.tags.split(',').map(t => t.trim()).filter(Boolean),
        teamMembers: editProject.teamMembers
      };
      await axios.put(`/projects/${selectedProject._id}`, payload);
      
      // Enhanced success message
      const teamChanged = JSON.stringify(editProject.teamMembers.sort()) !== 
                          JSON.stringify((selectedProject.team || []).map(tm => tm.user?._id || tm.user).filter(Boolean).sort());
      const message = teamChanged ? 'Project and team members updated successfully!' : 'Project updated successfully!';
      
      toast.success(message);
      setEditDialogOpen(false);
      setMenuAnchorEl(null);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
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

  // Auto-open edit dialog if redirected with ?edit=<projectId>
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (!editId || !projects || projects.length === 0) return;

    const projectToEdit = projects.find(p => (p._id === editId));
    if (projectToEdit) {
      openEditProject(projectToEdit);
      // Clean the URL so it doesn't reopen on re-render
      navigate('/projects', { replace: true });
    }
  }, [location.search, projects]);

  const handleCreateProject = async () => {
    try {
      const projectData = {
        ...newProject,
        startDate: newProject.startDate.toISOString(),
        endDate: newProject.endDate.toISOString(),
        budget: parseFloat(newProject.budget) || 0,
        tags: newProject.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await axios.post('/projects', projectData);
      toast.success('Project created successfully');
      setCreateDialogOpen(false);
      setNewProject({
        name: '',
        description: '',
        startDate: dayjs(),
        endDate: dayjs().add(1, 'month'),
        priority: 'medium',
        budget: '',
        tags: '',
        teamMembers: []
      });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleCreateTask = async () => {
    try {
      // Auto-assign to current user if they're a standard user
      const assigneeId = user?.role === 'admin' && newTask.assignee ? newTask.assignee : 
                          user?.role !== 'admin' ? user._id : newTask.assignee;

      const taskData = {
        ...newTask,
        assignee: assigneeId,
        dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
        estimatedHours: parseFloat(newTask.estimatedHours) || 0,
        tags: (newTask.tags || '').split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await axios.post('/tasks', taskData);
      
      const assigneeText = user?.role !== 'admin' ? ' and assigned to you' : 
                          assigneeId ? ` and assigned to ${users.find(u => u._id === assigneeId)?.name || 'user'}` : '';
      const projectName = projects.find(p => p._id === newTask.project)?.name || 'project';
      
      toast.success(`Task created successfully in ${projectName}${assigneeText}!`);
      setCreateTaskDialogOpen(false);
      
      // Reset form
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
      
      fetchProjects(); // Refresh to update any task counts if displayed
    } catch (error) {
      console.error('Error creating task:', error);
      const apiMsg = error?.response?.data?.message;
      const valMsg = error?.response?.data?.errors?.[0]?.msg;
      toast.error(apiMsg || valMsg || 'Failed to create task');
    }
  };

  const handleMenuOpen = (event, project) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedProject(null);
  };

  const handleArchiveProject = async () => {
    try {
      await axios.put(`/projects/${selectedProject._id}/archive`);
      toast.success('Project archived successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Failed to archive project');
    }
    handleMenuClose();
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

  const canCreateProject = user?.role === 'admin';

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Projects
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            Projects
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setCreateTaskDialogOpen(true)}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              New Task
            </Button>
            {canCreateProject && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
              >
                New Project
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {project.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, project);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    {project.description.length > 100 
                      ? `${project.description.substring(0, 100)}...`
                      : project.description
                    }
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={project.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(project.status),
                        color: 'white'
                      }}
                    />
                    <Chip
                      label={project.priority}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(project.priority),
                        color: 'white'
                      }}
                    />
                  </Box>


                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Manager: {project.manager?.name}
                    </Typography>
                  </Box>

                  {project.team && project.team.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Team:
                      </Typography>
                      <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 12 } }}>
                        {project.team.map((member, index) => (
                          <Tooltip key={index} title={member.user.name}>
                            <Avatar>
                              {member.user.name.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button size="small" startIcon={<TrendingUp />} onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project._id}`); }}>
                    View Details
                  </Button>
                  {user?.role === 'admin' && (
                    <Button size="small" startIcon={<Edit />} onClick={(e) => { e.stopPropagation(); openEditProject(project); }}>
                      Edit
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {projects.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No projects found
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setCreateTaskDialogOpen(true)}
              >
                Create a Task
              </Button>
              {canCreateProject && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Your First Project
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Project Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { const p = selectedProject; handleMenuClose(); if (p) openEditProject(p); }}>
            <Edit sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleArchiveProject}>
            <Archive sx={{ mr: 1 }} />
            Archive
          </MenuItem>
        </Menu>

        {/* Create Project Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create New Project
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={newProject.startDate}
                  onChange={(date) => setNewProject({ ...newProject, startDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={newProject.endDate}
                  onChange={(date) => setNewProject({ ...newProject, endDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newProject.priority}
                    label="Priority"
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Budget"
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags (comma separated)"
                  value={newProject.tags}
                  onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                  placeholder="frontend, backend, mobile"
                />
              </Grid>
              {users.length > 0 && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Team Members</InputLabel>
                    <Select
                      multiple
                      value={newProject.teamMembers}
                      label="Team Members"
                      onChange={(e) => setNewProject({ ...newProject, teamMembers: e.target.value })}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const user = users.find(u => u._id === value);
                            return (
                              <Chip
                                key={value}
                                label={user ? user.name : value}
                                size="small"
                                sx={{ m: 0.25 }}
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {users.filter(u => u._id !== user._id).map((u) => (
                        <MenuItem key={u._id} value={u._id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                              {u.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">{u.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {u.email} • {u.role}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    💡 You (project manager) will be automatically included
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateProject}
                disabled={!newProject.name || !newProject.description}
              >
                Create Project
              </Button>
            </Box>
          </Box>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Edit Project
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={editProject.name}
                  onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={editProject.description}
                  onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={editProject.startDate}
                  onChange={(date) => setEditProject({ ...editProject, startDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={editProject.endDate}
                  onChange={(date) => setEditProject({ ...editProject, endDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={editProject.priority}
                    label="Priority"
                    onChange={(e) => setEditProject({ ...editProject, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Budget"
                  type="number"
                  value={editProject.budget}
                  onChange={(e) => setEditProject({ ...editProject, budget: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags (comma separated)"
                  value={editProject.tags}
                  onChange={(e) => setEditProject({ ...editProject, tags: e.target.value })}
                  placeholder="frontend, backend, mobile"
                />
              </Grid>
              {selectedProject?.team && selectedProject.team.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Current Team Members:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      label={`${selectedProject.manager?.name} (Manager)`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    {selectedProject.team.map((member) => (
                      <Chip
                        key={member.user._id}
                        label={member.user.name}
                        color="default"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Grid>
              )}
              {users.length > 0 && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Team Members</InputLabel>
                    <Select
                      multiple
                      value={editProject.teamMembers}
                      label="Team Members"
                      onChange={(e) => setEditProject({ ...editProject, teamMembers: e.target.value })}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const user = users.find(u => u._id === value);
                            return (
                              <Chip
                                key={value}
                                label={user ? user.name : value}
                                size="small"
                                sx={{ m: 0.25 }}
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {users.filter(u => u._id !== selectedProject?.manager?._id).map((u) => (
                        <MenuItem key={u._id} value={u._id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                              {u.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">{u.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {u.email} • {u.role}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    💡 Project manager is automatically included and cannot be removed
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleUpdateProject} disabled={!editProject.name || !editProject.description}>Save Changes</Button>
            </Box>
          </Box>
        </Dialog>

        {/* Create Task Dialog */}
        <Dialog
          open={createTaskDialogOpen}
          onClose={() => setCreateTaskDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ p: 3 }}>
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
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, display: 'flex', alignItems: 'center', height: '56px' }}>
                    <Typography variant="body2" color="info.dark">
                      💡 Task will be assigned to you
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
                disabled={!newTask.title || !newTask.description || !newTask.project}
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

export default Projects;
