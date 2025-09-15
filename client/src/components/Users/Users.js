import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Block,
  Add,
  Email,
  Phone,
  PersonRemove,
  Warning
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    position: '',
    phone: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, userData) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedUser(userData);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedUser(null);
  };

  const handleEditUser = () => {
    setEditFormData({
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      department: selectedUser.department || '',
      position: selectedUser.position || '',
      phone: selectedUser.phone || ''
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleUpdateUser = async () => {
    try {
      await axios.put(`/users/${selectedUser._id}`, editFormData);
      toast.success('User updated successfully');
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeactivateUser = async () => {
    try {
      await axios.delete(`/users/${selectedUser._id}`);
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Failed to deactivate user');
    }
    handleMenuClose();
  };

  const handleRemoveUserClick = (userData) => {
    setUserToRemove(userData);
    setRemoveDialogOpen(true);
  };

  const handleConfirmRemoveUser = async () => {
    try {
      await axios.delete(`/users/${userToRemove._id}`);
      toast.success('User removed successfully');
      setRemoveDialogOpen(false);
      setUserToRemove(null);
      fetchUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    }
  };

  const handleCancelRemoveUser = () => {
    setRemoveDialogOpen(false);
    setUserToRemove(null);
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#f44336',
      standard: '#2196f3'
    };
    return colors[role] || '#757575';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check if current user has permission to manage users
  const canManageUsers = user?.role === 'admin';

  if (!canManageUsers) {
    return (
      <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Team Members
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You don't have permission to view team members.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Team Members
        </Typography>
        {user?.role === 'admin' && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => window.open('/register', '_blank')}
            >
              Add Member
            </Button>
            <Button
              variant="outlined"
              color={selectionMode ? "secondary" : "error"}
              startIcon={<PersonRemove />}
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (!selectionMode) {
                  toast.info('Selection mode enabled. Click on a user to remove them.');
                } else {
                  toast.info('Selection mode disabled.');
                }
              }}
            >
              {selectionMode ? 'Cancel Remove' : 'Remove User'}
            </Button>
          </Box>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((userData) => (
              <TableRow 
                key={userData._id}
                onClick={() => {
                  if (selectionMode && userData._id !== user._id) {
                    handleRemoveUserClick(userData);
                  }
                }}
                sx={{
                  cursor: selectionMode && userData._id !== user._id ? 'pointer' : 'default',
                  backgroundColor: selectionMode && userData._id !== user._id ? 'rgba(244, 67, 54, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: selectionMode && userData._id !== user._id ? 'rgba(244, 67, 54, 0.2)' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: getRoleColor(userData.role) }}>
                      {userData.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {userData.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {userData.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={userData.role}
                    size="small"
                    sx={{
                      bgcolor: getRoleColor(userData.role),
                      color: 'white',
                      textTransform: 'capitalize'
                    }}
                  />
                </TableCell>
                <TableCell>{userData.department || '-'}</TableCell>
                <TableCell>{userData.position || '-'}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      <Email sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
                      {userData.email}
                    </Typography>
                    {userData.phone && (
                      <Typography variant="body2">
                        <Phone sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
                        {userData.phone}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{formatDate(userData.createdAt)}</TableCell>
                <TableCell>
                  <Chip
                    label={userData.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={userData.isActive ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, userData)}
                    disabled={userData._id === user._id}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {users.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No team members found
          </Typography>
        </Box>
      )}

      {/* User Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditUser}>
          <Edit sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        {user?.role === 'admin' && (
          <MenuItem onClick={handleDeactivateUser}>
            <Block sx={{ mr: 1 }} />
            Deactivate
          </MenuItem>
        )}
      </Menu>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Edit User
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editFormData.role}
                  label="Role"
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={editFormData.position}
                onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateUser}
            >
              Update User
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Remove User Confirmation Dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={handleCancelRemoveUser}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Confirm User Removal
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to remove <strong>{userToRemove?.name}</strong> from the platform?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. The user will lose access to all projects and data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemoveUser}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmRemoveUser}
            startIcon={<PersonRemove />}
          >
            Remove User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
