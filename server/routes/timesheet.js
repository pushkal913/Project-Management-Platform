const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
const { authenticate } = require('../middleware/auth');

// @route   GET /timesheet
// @desc    Get detailed timesheet data with user and task breakdown
// @access  Private (Admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId, projectId, timeRange, startDate, endDate, search } = req.query;

    // Build query for tasks with time logs
    let taskQuery = { 
      isArchived: { $ne: true }
    };

    // Apply filters
    if (projectId) {
      taskQuery.project = projectId;
    }

    // Handle time range filters
    let timeFilter = {};
    const now = new Date();
    
    if (timeRange) {
      switch (timeRange) {
        case 'this-week':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          startOfWeek.setHours(0, 0, 0, 0);
          timeFilter = { $gte: startOfWeek };
          break;
        case 'this-month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          timeFilter = { $gte: startOfMonth };
          break;
        case 'last-month':
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          timeFilter = { $gte: startOfLastMonth, $lte: endOfLastMonth };
          break;
        case 'this-year':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          timeFilter = { $gte: startOfYear };
          break;
      }
    }

    // Custom date range
    if (startDate || endDate) {
      if (startDate) timeFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        timeFilter.$lte = end;
      }
    }

    // Get all matching tasks with populated fields
    let tasks = await Task.find(taskQuery)
      .populate('assignee', 'name email')
      .populate('project', 'name')
      .lean();

    // Search filter (applied after fetch for flexibility)
    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }

    // Process time logs based on view mode
    const viewMode = req.query.viewMode || 'by-user'; // by-user, by-task, detailed

    let timesheetData = [];
    let summary = {
      totalHours: 0,
      totalTasks: 0,
      activeUsers: new Set(),
      avgHoursPerTask: 0
    };

    if (viewMode === 'by-user') {
      // Group by user
      const userMap = new Map();

      for (const task of tasks) {
        // Filter time logs by time range and user
        let filteredTimeLogs = task.timeLogs || [];
        
        if (Object.keys(timeFilter).length > 0) {
          filteredTimeLogs = filteredTimeLogs.filter(log => {
            const logDate = new Date(log.loggedAt);
            if (timeFilter.$gte && logDate < timeFilter.$gte) return false;
            if (timeFilter.$lte && logDate > timeFilter.$lte) return false;
            return true;
          });
        }

        if (userId) {
          filteredTimeLogs = filteredTimeLogs.filter(log => {
            if (!log.user) return false;
            const logUserId = typeof log.user === 'object' ? log.user._id : log.user;
            return logUserId && logUserId.toString() === userId;
          });
        }

        // Process each time log
        for (const log of filteredTimeLogs) {
          if (!log.user) continue; // Skip logs without user
          
          const logUserId = typeof log.user === 'object' ? log.user._id : log.user;
          if (!logUserId) continue;
          
          const userIdStr = logUserId.toString();
          
          // Convert hours and minutes to total hours
          const totalHours = (log.hours || 0) + (log.minutes || 0) / 60;
          
          if (!userMap.has(userIdStr)) {
            // Fetch user details
            const user = await User.findById(logUserId).select('name email').lean();
            if (!user) continue;

            userMap.set(userIdStr, {
              userId: userIdStr,
              userName: user.name,
              userEmail: user.email,
              totalHours: 0,
              tasksCount: 0,
              tasks: [],
              projects: new Set()
            });
          }

          const userData = userMap.get(userIdStr);
          userData.totalHours += totalHours;
          
          // Check if this task is already counted for this user
          const existingTask = userData.tasks.find(t => t.taskId === task._id.toString());
          if (existingTask) {
            existingTask.hours += totalHours;
          } else {
            userData.tasksCount++;
            userData.tasks.push({
              taskId: task._id.toString(),
              taskTitle: task.title,
              projectName: task.project?.name || 'Unknown',
              hours: totalHours,
              status: task.status
            });
          }
          
          if (task.project?.name) {
            userData.projects.add(task.project.name);
          }

          summary.totalHours += totalHours;
          summary.activeUsers.add(userIdStr);
        }
      }

      // Convert map to array
      timesheetData = Array.from(userMap.values()).map(user => ({
        ...user,
        projects: Array.from(user.projects)
      }));

    } else if (viewMode === 'by-task') {
      // Group by task
      const taskMap = new Map();

      for (const task of tasks) {
        let filteredTimeLogs = task.timeLogs || [];
        
        if (Object.keys(timeFilter).length > 0) {
          filteredTimeLogs = filteredTimeLogs.filter(log => {
            const logDate = new Date(log.loggedAt);
            if (timeFilter.$gte && logDate < timeFilter.$gte) return false;
            if (timeFilter.$lte && logDate > timeFilter.$lte) return false;
            return true;
          });
        }

        if (userId) {
          filteredTimeLogs = filteredTimeLogs.filter(log => {
            if (!log.user) return false;
            const logUserId = typeof log.user === 'object' ? log.user._id : log.user;
            return logUserId && logUserId.toString() === userId;
          });
        }

        if (filteredTimeLogs.length === 0) continue;

        const taskIdStr = task._id.toString();
        
        if (!taskMap.has(taskIdStr)) {
          taskMap.set(taskIdStr, {
            taskId: taskIdStr,
            taskTitle: task.title,
            projectName: task.project?.name || 'Unknown',
            totalHours: 0,
            status: task.status,
            contributors: [], // Change to array to store objects
            userBreakdown: []
          });
        }

        const taskData = taskMap.get(taskIdStr);

        // Group time logs by user for this task
        const userLogsMap = new Map();
        
        for (const log of filteredTimeLogs) {
          if (!log.user) continue; // Skip logs without user
          
          const logUserId = typeof log.user === 'object' ? log.user._id : log.user;
          if (!logUserId) continue;
          
          const userIdStr = logUserId.toString();
          const totalHours = (log.hours || 0) + (log.minutes || 0) / 60;
          
          if (!userLogsMap.has(userIdStr)) {
            userLogsMap.set(userIdStr, {
              userId: userIdStr,
              hours: 0,
              lastLog: log.loggedAt
            });
          }
          
          const userLogData = userLogsMap.get(userIdStr);
          userLogData.hours += totalHours;
          if (new Date(log.loggedAt) > new Date(userLogData.lastLog)) {
            userLogData.lastLog = log.loggedAt;
          }
          
          taskData.totalHours += totalHours;
          summary.totalHours += totalHours;
          summary.activeUsers.add(userIdStr);
        }

        // Populate user details for breakdown
        for (const [userIdStr, logData] of userLogsMap) {
          const user = await User.findById(userIdStr).select('name email').lean();
          if (user) {
            // Add contributor with userId and userName for consistent coloring
            taskData.contributors.push({
              userId: userIdStr,
              userName: user.name
            });
            taskData.userBreakdown.push({
              userId: userIdStr,
              userName: user.name,
              hours: logData.hours,
              lastLog: logData.lastLog
            });
          }
        }
      }

      timesheetData = Array.from(taskMap.values());

    } else {
      // Detailed view - individual time log entries
      for (const task of tasks) {
        let filteredTimeLogs = task.timeLogs || [];
        
        if (Object.keys(timeFilter).length > 0) {
          filteredTimeLogs = filteredTimeLogs.filter(log => {
            const logDate = new Date(log.loggedAt);
            if (timeFilter.$gte && logDate < timeFilter.$gte) return false;
            if (timeFilter.$lte && logDate > timeFilter.$lte) return false;
            return true;
          });
        }

        if (userId) {
          filteredTimeLogs = filteredTimeLogs.filter(log => {
            if (!log.user) return false;
            const logUserId = typeof log.user === 'object' ? log.user._id : log.user;
            return logUserId && logUserId.toString() === userId;
          });
        }

        for (const log of filteredTimeLogs) {
          if (!log.user) continue; // Skip logs without user
          
          const logUserId = typeof log.user === 'object' ? log.user._id : log.user;
          if (!logUserId) continue;
          
          const user = await User.findById(logUserId).select('name email').lean();
          if (!user) continue;

          const totalHours = (log.hours || 0) + (log.minutes || 0) / 60;

          timesheetData.push({
            userId: logUserId.toString(),
            userName: user.name,
            userEmail: user.email,
            taskId: task._id.toString(),
            taskTitle: task.title,
            projectName: task.project?.name || 'Unknown',
            hours: totalHours,
            loggedAt: log.loggedAt,
            status: task.status
          });

          summary.totalHours += totalHours;
          summary.activeUsers.add(logUserId.toString());
        }
      }
    }

    // Calculate summary stats
    summary.activeUsers = summary.activeUsers.size;
    summary.totalTasks = viewMode === 'by-task' ? timesheetData.length : 
                        new Set(timesheetData.flatMap(d => d.tasks?.map(t => t.taskId) || [d.taskId])).size;
    summary.avgHoursPerTask = summary.totalTasks > 0 ? summary.totalHours / summary.totalTasks : 0;

    res.json({
      success: true,
      timesheetData,
      summary
    });

  } catch (error) {
    console.error('Error fetching timesheet data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch timesheet data',
      error: error.message 
    });
  }
});

module.exports = router;
