const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, isAdminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, isAdminOnly, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .populate('projects', 'name status')
      .sort({ name: 1 });
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('projects', 'name status description');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/:id', authenticate, isAdminOnly, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'standard']),
  body('department').optional().trim(),
  body('position').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, role, department, position, phone, isActive } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (position !== undefined) user.position = position;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate user (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Only admin can deactivate users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can deactivate users' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow self-deactivation
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const Task = require('../models/Task');
    const Project = require('../models/Project');

    const userId = req.params.id;
    
    // Get task statistics
    const taskStats = await Task.aggregate([
      { $match: { assignee: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get project count
    const projectCount = await Project.countDocuments({
      $or: [
        { manager: userId },
        { 'team.user': userId }
      ]
    });

    // Format task statistics
    const formattedTaskStats = {
      todo: 0,
      'in-progress': 0,
      review: 0,
      testing: 0,
      done: 0
    };

    taskStats.forEach(stat => {
      formattedTaskStats[stat._id] = stat.count;
    });

    res.json({
      taskStats: formattedTaskStats,
      projectCount,
      totalTasks: Object.values(formattedTaskStats).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
