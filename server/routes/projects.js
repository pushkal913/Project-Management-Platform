const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticate, isAdminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    let query = { isArchived: false };

    // All authenticated users can view projects as per current policy

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('manager', 'name email avatar')
      .populate('team.user', 'name email avatar role')
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name email avatar role')
      .populate('team.user', 'name email avatar role department')
      .populate('attachments.uploadedBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // All authenticated users can view project details as per current policy

    // Get project tasks summary
    const taskStats = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

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

    // Get related tasks with key fields
    const tasks = await Task.find({ project: req.params.id, isArchived: { $ne: true } })
      .select('title status dueDate description assignee')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });

    res.json({ 
      project,
      taskStats: formattedTaskStats,
      totalTasks: Object.values(formattedTaskStats).reduce((a, b) => a + b, 0),
      tasks
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project
router.post('/', authenticate, isAdminOnly, [
  body('name').trim().isLength({ min: 2 }).withMessage('Project name must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('budget').optional().isNumeric().withMessage('Budget must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, startDate, endDate, priority, budget, tags, teamMembers } = req.body;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Create project
    const project = new Project({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      priority: priority || 'medium',
      budget: budget || 0,
      manager: req.user._id,
      tags: tags || [],
      team: []
    });

    // Add team members
    if (teamMembers && teamMembers.length > 0) {
      for (const memberId of teamMembers) {
        const user = await User.findById(memberId);
        if (user) {
          project.team.push({
            user: memberId,
            role: 'member'
          });
          
          // Add project to user's projects
          if (!user.projects.includes(project._id)) {
            user.projects.push(project._id);
            await user.save();
          }
        }
      }
    }

    await project.save();

    // Add project to manager's projects
    const manager = await User.findById(req.user._id);
    if (!manager.projects.includes(project._id)) {
      manager.projects.push(project._id);
      await manager.save();
    }

    const populatedProject = await Project.findById(project._id)
      .populate('manager', 'name email avatar')
      .populate('team.user', 'name email avatar role');

    // Emit socket event for real-time updates
    req.io.emit('project-created', { project: populatedProject });

    res.status(201).json({
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project
router.put('/:id', authenticate, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('teamMembers').optional().isArray().withMessage('Team members must be an array'),
  body('teamMembers.*').optional().isMongoId().withMessage('Each team member must be a valid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions
    const canEdit = req.user.role === 'admin' || project.manager.toString() === req.user._id.toString();

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, startDate, endDate, priority, status, progress, budget, tags, teamMembers } = req.body;

    // Validate dates if provided
    const newStartDate = startDate ? new Date(startDate) : project.startDate;
    const newEndDate = endDate ? new Date(endDate) : project.endDate;

    if (newStartDate >= newEndDate) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Update basic fields
    if (name) project.name = name;
    if (description) project.description = description;
    if (startDate) project.startDate = newStartDate;
    if (endDate) project.endDate = newEndDate;
    if (priority) project.priority = priority;
    if (status) project.status = status;
    if (progress !== undefined) project.progress = progress;
    if (budget !== undefined) project.budget = budget;
    if (tags) project.tags = tags;

    // Handle team members update
    if (teamMembers !== undefined && Array.isArray(teamMembers)) {
      // Get current team member IDs
      const currentTeamIds = project.team.map(member => member.user.toString());
      
      // Remove project from users who are no longer team members
      const removedUserIds = currentTeamIds.filter(id => !teamMembers.includes(id));
      for (const userId of removedUserIds) {
        const user = await User.findById(userId);
        if (user) {
          user.projects = user.projects.filter(projectId => 
            projectId.toString() !== project._id.toString()
          );
          await user.save();
        }
      }

      // Add project to new team members
      const newUserIds = teamMembers.filter(id => !currentTeamIds.includes(id));
      for (const userId of newUserIds) {
        const user = await User.findById(userId);
        if (user && !user.projects.includes(project._id)) {
          user.projects.push(project._id);
          await user.save();
        }
      }

      // Update project team
      project.team = [];
      for (const memberId of teamMembers) {
        const user = await User.findById(memberId);
        if (user) {
          project.team.push({
            user: memberId,
            role: 'member' // Default role, could be enhanced to preserve existing roles
          });
        }
      }
    }

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('manager', 'name email avatar')
      .populate('team.user', 'name email avatar role');

    // Emit socket event
    req.io.to(`project-${project._id}`).emit('project-updated', { project: updatedProject });

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add team member to project
router.post('/:id/team', authenticate, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').optional().isIn(['member', 'lead']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions
    const canEdit = req.user.role === 'admin' ||
      project.manager.toString() === req.user._id.toString();

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { userId, role } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a team member
    const existingMember = project.team.find(member => 
      member.user.toString() === userId
    );

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    // Add team member
    project.team.push({
      user: userId,
      role: role || 'member'
    });

    await project.save();

    // Add project to user's projects
    if (!user.projects.includes(project._id)) {
      user.projects.push(project._id);
      await user.save();
    }

    const updatedProject = await Project.findById(project._id)
      .populate('manager', 'name email avatar')
      .populate('team.user', 'name email avatar role');

    res.json({
      message: 'Team member added successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove team member from project
router.delete('/:id/team/:userId', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions
    const canEdit = req.user.role === 'admin' ||
      project.manager.toString() === req.user._id.toString();

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { userId } = req.params;

    // Remove team member
    project.team = project.team.filter(member => 
      member.user.toString() !== userId
    );

    await project.save();

    // Remove project from user's projects
    const user = await User.findById(userId);
    if (user) {
      user.projects = user.projects.filter(projectId => 
        projectId.toString() !== project._id.toString()
      );
      await user.save();
    }

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive project
router.put('/:id/archive', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions
    const canArchive = req.user.role === 'admin' ||
      project.manager.toString() === req.user._id.toString();

    if (!canArchive) {
      return res.status(403).json({ message: 'Access denied' });
    }

    project.isArchived = true;
    await project.save();

    res.json({ message: 'Project archived successfully' });
  } catch (error) {
    console.error('Archive project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
