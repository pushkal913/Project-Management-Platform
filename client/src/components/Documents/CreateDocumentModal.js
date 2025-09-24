import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Alert,
  Chip,
  IconButton,
  Paper
} from '@mui/material';
import {
  Close,
  CloudUpload,
  AttachFile,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const CreateDocumentModal = ({ open, onClose, onDocumentCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    project: '',
    task: '',
    category: 'other',
    status: 'draft'
  });
  
  // File attachments
  const [attachments, setAttachments] = useState([]);

  const categories = [
    { value: 'requirement', label: 'Requirements' },
    { value: 'specification', label: 'Specifications' },
    { value: 'meeting-notes', label: 'Meeting Notes' },
    { value: 'design', label: 'Design' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch projects on mount
  useEffect(() => {
    if (open) {
      console.log('Modal opened, checking auth status...');
      console.log('User from AuthContext:', user);
      console.log('Token from localStorage:', localStorage.getItem('token'));
      fetchProjects();
    }
  }, [open]);

  // Fetch tasks when project changes
  useEffect(() => {
    if (formData.project) {
      console.log('Project changed, fetching tasks for project:', formData.project);
      fetchProjectTasks(formData.project);
    } else {
      setTasks([]);
      setFormData(prev => ({ ...prev, task: '' }));
    }
  }, [formData.project]);

  const fetchProjects = async () => {
    try {
      console.log('=== FETCHING PROJECTS DEBUG ===');
      console.log('Axios base URL:', axios.defaults.baseURL);
      console.log('Auth token exists:', !!localStorage.getItem('token'));
      console.log('Making request to: /projects');
      
      const response = await axios.get('/projects');
      console.log('Projects response status:', response.status);
      console.log('Projects response data:', response.data);
      setProjects(response.data.projects || []);
      console.log('Projects set in state:', response.data.projects?.length || 0);
    } catch (error) {
      console.error('=== PROJECTS FETCH ERROR ===');
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.message);
      console.error('Error config:', error.config);
      console.error('Full error:', error);
      toast.error('Failed to load projects');
    }
  };

  const fetchProjectTasks = async (projectId) => {
    try {
      setLoadingTasks(true);
      console.log('=== FETCHING TASKS DEBUG ===');
      console.log('Project ID:', projectId);
      console.log('Request URL:', `/tasks?project=${projectId}`);
      console.log('Full request URL with base:', axios.defaults.baseURL + `/tasks?project=${projectId}`);
      
      const response = await axios.get(`/tasks?project=${projectId}`);
      console.log('Tasks response status:', response.status);
      console.log('Tasks response data:', response.data);
      const projectTasks = response.data.tasks || response.data || [];
      console.log('Setting tasks:', projectTasks);
      setTasks(projectTasks);
    } catch (error) {
      console.error('=== TASKS FETCH ERROR ===');
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.message);
      console.error('Error config:', error.config);
      console.error('Full error:', error);
      toast.error('Failed to load tasks for selected project');
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    event.target.value = ''; // Reset file input
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Please enter a document title');
      return;
    }
    
    if (!formData.project) {
      toast.error('Please select a project');
      return;
    }

    setLoading(true);
    try {
      // For now, we'll create the document without file uploads
      // File upload functionality can be added later with cloud storage
      const documentData = {
        ...formData,
        task: formData.task || null
      };

      const response = await axios.post('/documents', documentData);
      
      toast.success('Document created successfully!');
      onDocumentCreated();
      handleClose();
    } catch (error) {
      console.error('Error creating document:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create document';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      project: '',
      task: '',
      category: 'other',
      status: 'draft'
    });
    setAttachments([]);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            Create New Document
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Document Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              placeholder="Enter document title..."
            />
          </Grid>

          {/* Project Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Project *</InputLabel>
              <Select
                value={formData.project}
                onChange={(e) => {
                  console.log('Project selected:', e.target.value);
                  handleInputChange('project', e.target.value);
                }}
                label="Project *"
              >
                {projects.length === 0 ? (
                  <MenuItem disabled>
                    {loading ? 'Loading projects...' : 'No projects available'}
                  </MenuItem>
                ) : (
                  projects.map(project => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Task Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Task (Optional)</InputLabel>
              <Select
                value={formData.task}
                onChange={(e) => handleInputChange('task', e.target.value)}
                label="Task (Optional)"
                disabled={!formData.project}
              >
                <MenuItem value="">No specific task</MenuItem>
                {loadingTasks ? (
                  <MenuItem disabled>Loading tasks...</MenuItem>
                ) : (
                  tasks.map(task => (
                    <MenuItem key={task._id} value={task._id}>
                      {task.title}
                    </MenuItem>
                  ))
                )}
                {!loadingTasks && formData.project && tasks.length === 0 && (
                  <MenuItem disabled>No tasks available for this project</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Category */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                label="Category"
              >
                {categories.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Content */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Document Content"
              multiline
              rows={6}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter your document content here..."
            />
          </Grid>

          {/* File Attachments */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              File Attachments
            </Typography>
            
            {/* File Upload Button */}
            <Box sx={{ mb: 2 }}>
              <input
                accept="*"
                style={{ display: 'none' }}
                id="file-upload"
                multiple
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  sx={{ 
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    py: 2,
                    px: 3
                  }}
                >
                  Upload Files
                </Button>
              </label>
            </Box>

            {/* Attachment List */}
            {attachments.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Attached Files:
                </Typography>
                {attachments.map((attachment) => (
                  <Paper
                    key={attachment.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFile fontSize="small" />
                      <Box>
                        <Typography variant="body2" component="div">
                          {attachment.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(attachment.size)}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => removeAttachment(attachment.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}

            {/* File Upload Info */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> File storage functionality will be implemented with cloud storage integration. 
                For now, documents can be created with text content and linked to projects/tasks.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.title.trim() || !formData.project}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
            }
          }}
        >
          {loading ? 'Creating...' : 'Create Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateDocumentModal;