const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, assignee, project, search, dueDate, timeFilter } = req.query;
    let query = { isArchived: false };

    // Filter by user role - non-admin users see tasks assigned to them or in their projects
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({
        $or: [
          { manager: req.user._id },
          { 'team.user': req.user._id }
        ]
      }).select('_id');
      
      const projectIds = userProjects.map(p => p._id);
      
      query.$or = [
        { assignee: req.user._id },
        { reporter: req.user._id },
        { project: { $in: projectIds } }
      ];
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (project) query.project = project;
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }
    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      query.dueDate = { $gte: date, $lt: nextDay };
    }

    // Time filter based on creation date
    if (timeFilter) {
      const now = new Date();
      let startDate, endDate;

      switch (timeFilter) {
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case 'last-3-months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
      }

      if (startDate && endDate) {
        query.createdAt = { $gte: startDate, $lte: endDate };
      }
    }

    const tasks = await Task.find(query)
      .populate('project', 'name status')
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Log time to task
router.post('/:id/time', authenticate, [
  body('hours').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Hours must be a non-negative integer'),
  body('minutes').optional({ checkFalsy: true }).isInt({ min: 0, max: 59 }).withMessage('Minutes must be between 0 and 59')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Access: admin, assignee, reporter, project manager, or in project team
    const hasAccess = req.user.role === 'admin' ||
      task.assignee?.toString() === req.user._id.toString() ||
      task.reporter.toString() === req.user._id.toString() ||
      task.project.manager.toString() === req.user._id.toString() ||
      task.project.team.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const hours = parseInt(req.body.hours ?? 0, 10) || 0;
    const minutes = parseInt(req.body.minutes ?? 0, 10) || 0;

    const increment = hours + (minutes / 60);
    if (increment <= 0) {
      return res.status(400).json({ message: 'Please provide hours or minutes greater than 0' });
    }

    task.actualHours = (task.actualHours || 0) + increment;
    task.timeLogs.push({ user: req.user._id, hours, minutes, loggedAt: new Date() });
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('project', 'name status')
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('timeLogs.user', 'name email avatar');

    // Emit socket event
    req.io.to(`project-${task.project._id}`).emit('task-time-logged', {
      taskId: task._id,
      actualHours: updatedTask.actualHours
    });

    res.json({
      message: 'Time logged successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Log time error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name status manager team')
      .populate('assignee', 'name email avatar role')
      .populate('reporter', 'name email avatar role')
      .populate('comments.user', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email')
      .populate('dependencies', 'title status priority')
      .populate('timeLogs.user', 'name email avatar');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this task
    const hasAccess = req.user.role === 'admin' ||
      task.assignee?._id.toString() === req.user._id.toString() ||
      task.reporter._id.toString() === req.user._id.toString() ||
      task.project.manager.toString() === req.user._id.toString() ||
      task.project.team.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task
router.post('/', authenticate, [
  body('title').trim().isLength({ min: 3 }).withMessage('Task title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('project').isMongoId().withMessage('Valid project ID is required'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('type').isIn(['feature', 'bug', 'improvement', 'task', 'story']).withMessage('Invalid task type'),
  body('assignee').optional({ checkFalsy: true, nullable: true }).isMongoId().withMessage('Valid assignee ID required'),
  body('dueDate').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Valid due date required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, project, priority, type, assignee, dueDate, estimatedHours, tags } = req.body;

    // Check if project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasProjectAccess = req.user.role === 'admin' ||
      projectDoc.manager.toString() === req.user._id.toString() ||
      projectDoc.team.some(member => member.user.toString() === req.user._id.toString());

    if (!hasProjectAccess) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Determine effective assignee
    let effectiveAssignee = assignee || null;
    // If a non-admin user creates a task, auto-assign to themselves
    if (req.user.role !== 'admin') {
      effectiveAssignee = req.user._id;
    } else if (effectiveAssignee) {
      // Admin-provided assignee, validate it
      const assigneeUser = await User.findById(effectiveAssignee);
      if (!assigneeUser) {
        return res.status(404).json({ message: 'Assignee not found' });
      }
    }

    // Create task
    const task = new Task({
      title,
      description,
      project,
      priority: priority || 'medium',
      type: type || 'task',
      assignee: effectiveAssignee,
      reporter: req.user._id,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours: estimatedHours || 0,
      tags: tags || []
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name status')
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Emit socket event
    req.io.to(`project-${project}`).emit('task-created', { task: populatedTask });

    res.status(201).json({
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', authenticate, [
  body('title').optional().trim().isLength({ min: 3 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'testing', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('type').optional().isIn(['feature', 'bug', 'improvement', 'task', 'story']),
  body('assignee').optional({ checkFalsy: true, nullable: true }).isMongoId(),
  body('dueDate').optional({ checkFalsy: true, nullable: true }).isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    const canEdit = req.user.role === 'admin' ||
      task.assignee?.toString() === req.user._id.toString() ||
      task.reporter.toString() === req.user._id.toString() ||
      task.project.manager.toString() === req.user._id.toString();

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, status, priority, type, assignee, dueDate, estimatedHours, actualHours, tags } = req.body;

    // Validate assignee if provided
    if (assignee) {
      const assigneeUser = await User.findById(assignee);
      if (!assigneeUser) {
        return res.status(404).json({ message: 'Assignee not found' });
      }
    }

    // Update fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (type) task.type = type;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (tags) task.tags = tags;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('project', 'name status')
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Emit socket event
    req.io.to(`project-${task.project._id}`).emit('task-updated', { task: updatedTask });

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to task
router.post('/:id/comments', authenticate, [
  body('content').trim().isLength({ min: 1 }).withMessage('Comment content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this task
    const hasAccess = req.user.role === 'admin' ||
      task.assignee?.toString() === req.user._id.toString() ||
      task.reporter.toString() === req.user._id.toString() ||
      task.project.manager.toString() === req.user._id.toString() ||
      task.project.team.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { content } = req.body;

    task.comments.push({
      user: req.user._id,
      content
    });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('comments.user', 'name email avatar');

    // Emit socket event
    req.io.to(`project-${task.project._id}`).emit('task-comment-added', { 
      taskId: task._id,
      comment: updatedTask.comments[updatedTask.comments.length - 1]
    });

    res.json({
      message: 'Comment added successfully',
      comment: updatedTask.comments[updatedTask.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add subtask
router.post('/:id/subtasks', authenticate, [
  body('title').trim().isLength({ min: 1 }).withMessage('Subtask title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title } = req.body;

    task.subtasks.push({ title });
    await task.save();

    res.json({
      message: 'Subtask added successfully',
      subtask: task.subtasks[task.subtasks.length - 1]
    });
  } catch (error) {
    console.error('Add subtask error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update subtask
router.put('/:id/subtasks/:subtaskId', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    const { completed } = req.body;
    if (completed !== undefined) {
      subtask.completed = completed;
    }

    await task.save();

    res.json({
      message: 'Subtask updated successfully',
      subtask
    });
  } catch (error) {
    console.error('Update subtask error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    const canDelete = req.user.role === 'admin' ||
      task.reporter.toString() === req.user._id.toString() ||
      task.project.manager.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    task.isArchived = true;
    await task.save();

    res.json({ message: 'Task archived successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
