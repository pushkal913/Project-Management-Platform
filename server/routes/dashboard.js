const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Admin: Time report per user (weekly/monthly or custom range)
router.get('/time-report', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { period = '7', start, end, project } = req.query;
    let startDate, endDate;
    if (start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
    } else if (period === 'this-month') {
      // Get current month's start and end dates
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      const days = parseInt(period, 10) || 7;
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);
    }

    const matchStage = {
      isArchived: false
    };
    if (project) {
      matchStage.project = new mongoose.Types.ObjectId(project);
    }

    const pipelineBase = [
      { $match: matchStage },
      { $unwind: '$timeLogs' },
      {
        $match: {
          'timeLogs.loggedAt': { $gte: startDate, $lte: endDate }
        }
      },
      {
        $addFields: {
          _hours: { $add: [ { $ifNull: ['$timeLogs.hours', 0] }, { $divide: [ { $ifNull: ['$timeLogs.minutes', 0] }, 60 ] } ] }
        }
      }
    ];

    // Totals per user
    const totalsByUser = await Task.aggregate([
      ...pipelineBase,
      {
        $group: {
          _id: '$timeLogs.user',
          totalHours: { $sum: '$_hours' }
        }
      },
      { $sort: { totalHours: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          user: { _id: '$user._id', name: '$user.name', email: '$user.email', avatar: '$user.avatar' },
          totalHours: { $round: ['$totalHours', 2] }
        }
      }
    ]);

    // Breakdown per user and project
    const byUserAndProject = await Task.aggregate([
      ...pipelineBase,
      {
        $group: {
          _id: { user: '$timeLogs.user', project: '$project' },
          totalHours: { $sum: '$_hours' }
        }
      },
      {
        $lookup: { from: 'users', localField: '_id.user', foreignField: '_id', as: 'user' }
      },
      { $unwind: '$user' },
      {
        $lookup: { from: 'projects', localField: '_id.project', foreignField: '_id', as: 'project' }
      },
      { $unwind: '$project' },
      {
        $project: {
          _id: 0,
          user: { _id: '$user._id', name: '$user.name' },
          project: { _id: '$project._id', name: '$project.name' },
          totalHours: { $round: ['$totalHours', 2] }
        }
      },
      { $sort: { 'user.name': 1, totalHours: -1 } }
    ]);

    // Breakdown per user and task
    const byUserAndTask = await Task.aggregate([
      ...pipelineBase,
      {
        $group: {
          _id: { user: '$timeLogs.user', task: '$_id', project: '$project', title: '$title' },
          totalHours: { $sum: '$_hours' }
        }
      },
      { $sort: { totalHours: -1 } },
      { $limit: 100 },
      { $lookup: { from: 'users', localField: '_id.user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $lookup: { from: 'projects', localField: '_id.project', foreignField: '_id', as: 'project' } },
      { $unwind: '$project' },
      {
        $project: {
          _id: 0,
          user: { _id: '$user._id', name: '$user.name' },
          task: { _id: '$_id.task', title: '$_id.title' },
          project: { _id: '$project._id', name: '$project.name' },
          totalHours: { $round: ['$totalHours', 2] }
        }
      }
    ]);

    res.json({
      period: { start: startDate, end: endDate },
      totalsByUser,
      byUserAndProject,
      byUserAndTask
    });
  } catch (error) {
    console.error('Time report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard overview
router.get('/overview', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get user's projects
    let projectQuery = {};
    if (userRole !== 'admin') {
      projectQuery = {
        $or: [
          { manager: userId },
          { 'team.user': userId }
        ]
      };
    }

    const userProjects = await Project.find({
      ...projectQuery,
      isArchived: false
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);

    // Task statistics
    const taskStats = await Task.aggregate([
      {
        $match: {
          isArchived: false,
          ...(projectIds.length > 0 && userRole !== 'admin' 
            ? { project: { $in: projectIds } } 
            : {})
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // My assigned tasks
    const myTasks = await Task.find({
      assignee: userId,
      isArchived: false
    }).countDocuments();

    // Overdue tasks
    const overdueTasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ['done'] },
      isArchived: false,
      ...(projectIds.length > 0 && userRole !== 'admin' 
        ? { project: { $in: projectIds } } 
        : {})
    }).countDocuments();

    // Project statistics
    const projectStats = await Project.aggregate([
      {
        $match: {
          ...projectQuery,
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activities (tasks created/updated in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTasks = await Task.find({
      updatedAt: { $gte: sevenDaysAgo },
      isArchived: false,
      ...(projectIds.length > 0 && userRole !== 'admin' 
        ? { project: { $in: projectIds } } 
        : {})
    })
    .populate('project', 'name')
    .populate('assignee', 'name avatar')
    .populate('reporter', 'name avatar')
    .sort({ updatedAt: -1 })
    .limit(10);

    // Upcoming deadlines (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingTasks = await Task.find({
      dueDate: { $gte: new Date(), $lte: nextWeek },
      status: { $nin: ['done'] },
      isArchived: false,
      ...(projectIds.length > 0 && userRole !== 'admin' 
        ? { project: { $in: projectIds } } 
        : {})
    })
    .populate('project', 'name')
    .populate('assignee', 'name avatar')
    .sort({ dueDate: 1 })
    .limit(5);

    // Team workload (admin only)
    let teamWorkload = [];
    if (userRole === 'admin') {
      // First get all active users
      const allUsers = await User.find({ isActive: true }).select('_id name email avatar');
      
      // Get current month's start and end dates for task filtering
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Then get task counts for each user for current month only
      const taskCounts = await Task.aggregate([
        {
          $match: {
            assignee: { $exists: true, $ne: null },
            isArchived: false,
            // Filter tasks created or due in current month
            $or: [
              { createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } },
              { dueDate: { $gte: currentMonthStart, $lte: currentMonthEnd } }
            ]
          }
        },
        {
          $group: {
            _id: '$assignee',
            taskCount: { $sum: 1 },
            highPriorityTasks: {
              $sum: { $cond: [{ $in: ['$priority', ['high', 'critical']] }, 1, 0] }
            }
          }
        }
      ]);

      // Create a map for quick lookup
      const taskCountMap = new Map();
      taskCounts.forEach(tc => {
        taskCountMap.set(tc._id.toString(), tc);
      });

      // Build the team workload array with all users
      teamWorkload = allUsers.map(user => {
        const userTaskData = taskCountMap.get(user._id.toString()) || { taskCount: 0, highPriorityTasks: 0 };
        return {
          _id: user._id,
          taskCount: userTaskData.taskCount,
          highPriorityTasks: userTaskData.highPriorityTasks,
          user: {
            name: user.name,
            email: user.email,
            avatar: user.avatar
          }
        };
      });

      // Sort by task count descending
      teamWorkload.sort((a, b) => b.taskCount - a.taskCount);
    }

    // Format statistics
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

    const formattedProjectStats = {
      planning: 0,
      active: 0,
      'on-hold': 0,
      completed: 0,
      cancelled: 0
    };

    projectStats.forEach(stat => {
      formattedProjectStats[stat._id] = stat.count;
    });

    res.json({
      taskStats: formattedTaskStats,
      projectStats: formattedProjectStats,
      myTasks,
      overdueTasks,
      totalTasks: Object.values(formattedTaskStats).reduce((a, b) => a + b, 0),
      totalProjects: Object.values(formattedProjectStats).reduce((a, b) => a + b, 0),
      recentActivities: recentTasks,
      upcomingDeadlines: upcomingTasks,
      teamWorkload
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task analytics
router.get('/analytics/tasks', authenticate, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userId = req.user._id;
    const userRole = req.user.role;

    // Get user's projects for filtering
    let projectQuery = {};
    if (userRole !== 'admin') {
      projectQuery = {
        $or: [
          { manager: userId },
          { 'team.user': userId }
        ]
      };
    }

    const userProjects = await Project.find({
      ...projectQuery,
      isArchived: false
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);

    // Task creation trend
    const taskCreationTrend = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isArchived: false,
          ...(projectIds.length > 0 && userRole !== 'admin' 
            ? { project: { $in: projectIds } } 
            : {})
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Task completion trend
    const taskCompletionTrend = await Task.aggregate([
      {
        $match: {
          updatedAt: { $gte: startDate },
          status: 'done',
          isArchived: false,
          ...(projectIds.length > 0 && userRole !== 'admin' 
            ? { project: { $in: projectIds } } 
            : {})
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
            day: { $dayOfMonth: '$updatedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Priority distribution
    const priorityDistribution = await Task.aggregate([
      {
        $match: {
          isArchived: false,
          ...(projectIds.length > 0 && userRole !== 'admin' 
            ? { project: { $in: projectIds } } 
            : {})
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Type distribution
    const typeDistribution = await Task.aggregate([
      {
        $match: {
          isArchived: false,
          ...(projectIds.length > 0 && userRole !== 'admin' 
            ? { project: { $in: projectIds } } 
            : {})
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      taskCreationTrend,
      taskCompletionTrend,
      priorityDistribution,
      typeDistribution
    });
  } catch (error) {
    console.error('Task analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project analytics
router.get('/analytics/projects', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get user's projects
    let projectQuery = {};
    if (userRole !== 'admin') {
      projectQuery = {
        $or: [
          { manager: userId },
          { 'team.user': userId }
        ]
      };
    }

    // Project progress distribution
    const projectProgress = await Project.aggregate([
      {
        $match: {
          ...projectQuery,
          isArchived: false
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$progress', 25] }, then: '0-25%' },
                { case: { $lt: ['$progress', 50] }, then: '25-50%' },
                { case: { $lt: ['$progress', 75] }, then: '50-75%' },
                { case: { $lt: ['$progress', 100] }, then: '75-99%' }
              ],
              default: '100%'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Budget vs actual (if budget tracking is implemented)
    const budgetAnalysis = await Project.aggregate([
      {
        $match: {
          ...projectQuery,
          isArchived: false,
          budget: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$budget' },
          averageBudget: { $avg: '$budget' },
          projectCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      projectProgress,
      budgetAnalysis: budgetAnalysis[0] || { totalBudget: 0, averageBudget: 0, projectCount: 0 }
    });
  } catch (error) {
    console.error('Project analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
