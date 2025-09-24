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
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close,
  Edit,
  Save,
  Cancel,
  AttachFile
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const ViewDocumentModal = ({ open, onClose, document, isEditing, onDocumentUpdated }) => {
  const [editMode, setEditMode] = useState(isEditing);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    status: ''
  });

  // Update form data when document changes
  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title || '',
        content: document.content || '',
        category: document.category || '',
        status: document.status || ''
      });
    }
    setEditMode(isEditing);
  }, [document, isEditing]);

  const categoryOptions = [
    { value: 'requirement', label: 'Requirements' },
    { value: 'specification', label: 'Specifications' },
    { value: 'meeting-notes', label: 'Meeting Notes' },
    { value: 'design', label: 'Design' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Document title is required');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        status: formData.status
      };

      await axios.put(`/documents/${document._id}`, updateData);
      toast.success('Document updated successfully');
      setEditMode(false);
      onDocumentUpdated();
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original document data
    if (document) {
      setFormData({
        title: document.title || '',
        content: document.content || '',
        category: document.category || '',
        status: document.status || ''
      });
    }
    setEditMode(false);
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
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? option.label : category;
  };

  if (!document) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
          {editMode ? 'Edit Document' : 'View Document'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!editMode && (
            <IconButton 
              onClick={() => setEditMode(true)}
              sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              <Edit />
            </IconButton>
          )}
          <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Grid container spacing={3}>
          {/* Document Title */}
          <Grid item xs={12}>
            {editMode ? (
              <TextField
                fullWidth
                label="Document Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#2196F3' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.8)' }
                }}
              />
            ) : (
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                {document.title}
              </Typography>
            )}
          </Grid>

          {/* Project and Task Info */}
          {!editMode && (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                  Project
                </Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  {document.project?.name}
                </Typography>
              </Grid>
              
              {document.task && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                    Task
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    {document.task.title}
                  </Typography>
                </Grid>
              )}
            </>
          )}

          {/* Category and Status */}
          <Grid item xs={12} sm={6}>
            {editMode ? (
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Category"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196F3' }
                  }}
                >
                  {categoryOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                  Category
                </Typography>
                <Chip 
                  label={getCategoryLabel(document.category)} 
                  variant="outlined" 
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            {editMode ? (
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  label="Status"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196F3' }
                  }}
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                  Status
                </Typography>
                <Chip 
                  label={document.status} 
                  color={getStatusColor(document.status)} 
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            )}
          </Grid>

          {/* Document Content */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2 }}>
              Content
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                multiline
                rows={12}
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter document content..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#2196F3' }
                  }
                }}
              />
            ) : (
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'white',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  minHeight: '200px',
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 1,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {document.content || 'No content available...'}
              </Typography>
            )}
          </Grid>

          {/* File Attachments */}
          {!editMode && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2 }}>
                File Attachments
              </Typography>
              {document.attachments && document.attachments.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {document.attachments.map((attachment, index) => (
                    <Box 
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 1,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)'
                        }
                      }}
                    >
                      <AttachFile sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 20 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                          {attachment.originalName || attachment.filename || 'Untitled File'}
                        </Typography>
                        {attachment.size && (
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB • {attachment.mimetype || 'Unknown type'}
                          </Typography>
                        )}
                        {attachment.uploadedAt && (
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', ml: 1 }}>
                            • Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                      {attachment.url && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => window.open(attachment.url, '_blank')}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          Download
                        </Button>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box 
                  sx={{
                    p: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 1,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    textAlign: 'center'
                  }}
                >
                  <AttachFile sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 32, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    No file attachments
                  </Typography>
                </Box>
              )}
            </Grid>
          )}

          {/* Meta Info */}
          {!editMode && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Created by {document.createdBy?.name} on {new Date(document.createdAt).toLocaleDateString()}
                {document.updatedAt && new Date(document.updatedAt).getTime() !== new Date(document.createdAt).getTime() && (
                  <> • Last updated on {new Date(document.updatedAt).toLocaleDateString()}</>
                )}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {editMode ? (
          <>
            <Button 
              onClick={handleCancel}
              startIcon={<Cancel />}
              sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              startIcon={<Save />}
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                }
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button 
            onClick={() => setEditMode(true)}
            startIcon={<Edit />}
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
              }
            }}
          >
            Edit Document
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ViewDocumentModal;