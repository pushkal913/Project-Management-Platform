import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add,
  Description,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import CreateDocumentModal from './CreateDocumentModal';
import ViewDocumentModal from './ViewDocumentModal';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  // Fetch documents and projects
  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('=== FETCHING DOCUMENTS DEBUG ===');
      console.log('User:', user);
      console.log('Axios base URL:', axios.defaults.baseURL);
      console.log('Auth token exists:', !!localStorage.getItem('token'));
      console.log('Making request to: /documents');
      
      const response = await axios.get('/documents');
      console.log('Documents response status:', response.status);
      console.log('Documents response data:', response.data);
      setDocuments(response.data.documents || []);
      console.log('Documents set in state:', response.data.documents?.length || 0);
    } catch (error) {
      console.error('=== DOCUMENTS FETCH ERROR ===');
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.message);
      console.error('Error config:', error.config);
      console.error('Full error:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentCreated = () => {
    fetchDocuments(); // Refresh the list
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setIsEditing(false);
    setViewModalOpen(true);
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setIsEditing(true);
    setViewModalOpen(true);
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(`/documents/${documentId}`);
      toast.success('Document deleted successfully');
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedDocument(null);
    setIsEditing(false);
  };

  const handleDocumentUpdated = () => {
    fetchDocuments(); // Refresh the list
    handleCloseViewModal();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'warning';
      case 'review': return 'info';
      case 'approved': return 'success';
      default: return 'default';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      requirement: 'Requirements',
      specification: 'Specifications',
      'meeting-notes': 'Meeting Notes',
      design: 'Design',
      documentation: 'Documentation',
      credentials: 'Credentials',
      other: 'Other'
    };
    return labels[category] || category;
  };

  // Filter documents by selected project
  const filteredDocuments = selectedProject 
    ? documents.filter(doc => doc.project?._id === selectedProject)
    : documents;

  const handleProjectFilterChange = (event) => {
    setSelectedProject(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Documents
        </Typography>
        <Typography sx={{ color: 'white' }}>Loading documents...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'white' }}>
          Documents
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateModalOpen(true)}
          sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
            }
          }}
        >
          Create Document
        </Button>
      </Box>

      {/* Project Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl 
          sx={{ 
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.15)',
              }
            },
            '& .MuiInputLabel-root': {
              color: 'white',
            },
            '& .MuiSelect-select': {
              color: 'white',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            }
          }}
        >
          <InputLabel>Filter by Project</InputLabel>
          <Select
            value={selectedProject}
            onChange={handleProjectFilterChange}
            label="Filter by Project"
          >
            <MenuItem value="">All Projects</MenuItem>
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card sx={{ 
          p: 4, 
          textAlign: 'center', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Description sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.7)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            {selectedProject ? 'No documents for selected project' : 'No documents yet'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            {selectedProject ? 'Try selecting a different project or create a new document.' : 'Create your first document to get started'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
              }
            }}
          >
            Create First Document
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredDocuments.map((doc) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={doc._id}>
              <Card 
                onClick={() => handleViewDocument(doc)}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    background: 'rgba(255, 255, 255, 0.15)',
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
                  {/* Document Title */}
                  <Typography 
                    variant="h6" 
                    component="h2" 
                    gutterBottom 
                    noWrap 
                    sx={{ 
                      color: 'white', 
                      fontSize: '1.1rem',
                      lineHeight: 1.3,
                      mb: 1
                    }}
                  >
                    {doc.title}
                  </Typography>

                  {/* Project & Task Info */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                      <strong>{doc.project?.name}</strong>
                    </Typography>
                    {doc.task && (
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                        Task: {doc.task.title}
                      </Typography>
                    )}
                  </Box>

                  {/* Content Preview */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1.5,
                      color: 'rgba(255, 255, 255, 0.7)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '35px',
                      fontSize: '0.8rem',
                      lineHeight: 1.3
                    }}
                  >
                    {doc.content || 'No content yet...'}
                  </Typography>

                  {/* Status & Category */}
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
                    <Chip 
                      label={doc.status} 
                      color={getStatusColor(doc.status)} 
                      size="small" 
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        height: '20px'
                      }}
                    />
                    <Chip 
                      label={getCategoryLabel(doc.category)} 
                      variant="outlined" 
                      size="small" 
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.7rem',
                        height: '20px'
                      }}
                    />
                  </Box>

                  {/* Meta Info */}
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                    {doc.createdBy?.name} • {new Date(doc.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>

                {/* Actions */}
                <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Tooltip title="View Document">
                    <IconButton 
                      size="small" 
                      sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocument(doc);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Document">
                    <IconButton 
                      size="small" 
                      sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDocument(doc);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Document">
                    <IconButton 
                      size="small" 
                      sx={{ color: '#ff6b6b' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc._id);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Document Modal */}
      <CreateDocumentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* View/Edit Document Modal */}
      <ViewDocumentModal
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        document={selectedDocument}
        isEditing={isEditing}
        onDocumentUpdated={handleDocumentUpdated}
      />
    </Box>
  );
};

export default Documents;