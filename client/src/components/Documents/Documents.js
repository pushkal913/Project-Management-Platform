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
  Tooltip
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

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch documents
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/documents');
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
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
      other: 'Other'
    };
    return labels[category] || category;
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
          onClick={() => {/* TODO: Open create modal */}}
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

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card sx={{ 
          p: 4, 
          textAlign: 'center', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Description sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.7)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            No documents yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            Create your first document to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* TODO: Open create modal */}}
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
          {documents.map((doc) => (
            <Grid item xs={12} md={6} lg={4} key={doc._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    background: 'rgba(255, 255, 255, 0.15)',
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Document Title */}
                  <Typography variant="h6" component="h2" gutterBottom noWrap sx={{ color: 'white' }}>
                    {doc.title}
                  </Typography>

                  {/* Project & Task Info */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Project: <strong>{doc.project?.name}</strong>
                    </Typography>
                    {doc.task && (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        Task: {doc.task.title}
                      </Typography>
                    )}
                  </Box>

                  {/* Content Preview */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 2,
                      color: 'rgba(255, 255, 255, 0.7)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '60px'
                    }}
                  >
                    {doc.content || 'No content yet...'}
                  </Typography>

                  {/* Status & Category */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={doc.status} 
                      color={getStatusColor(doc.status)} 
                      size="small" 
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <Chip 
                      label={getCategoryLabel(doc.category)} 
                      variant="outlined" 
                      size="small" 
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        color: 'rgba(255, 255, 255, 0.8)'
                      }}
                    />
                  </Box>

                  {/* Meta Info */}
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Created by {doc.createdBy?.name} • {new Date(doc.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>

                {/* Actions */}
                <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Tooltip title="View Document">
                    <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Document">
                    <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Document">
                    <IconButton size="small" sx={{ color: '#ff6b6b' }}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Documents;