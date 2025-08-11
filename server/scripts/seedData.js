const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management';
console.log('Using MongoDB URI:', MONGODB_URI);

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    console.log('Cleared existing data');

    // Create required users only
    const users = [
      {
        name: 'Admin User',
        email: 'admin@projecthub.com',
        password: 'admin123',
        role: 'admin',
        department: 'Management',
        position: 'System Administrator',
        phone: '+1-555-0001'
      },
      {
        name: 'Shubham Katoch',
        email: 'shubhamkatoch@techknogeeks.com',
        password: 'shubham123katoch',
        role: 'standard',
        department: 'Engineering',
        position: 'Engineer'
      },
      {
        name: 'Samar Marwaha',
        email: 'samar@techknogeeks.com',
        password: 'samar123marwaha',
        role: 'standard',
        department: 'Engineering',
        position: 'Engineer'
      },
      {
        name: 'Muskan Dhillon',
        email: 'muskan@techknogeeks.com',
        password: 'muskan123dhillon',
        role: 'standard',
        department: 'Engineering',
        position: 'Engineer'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.name} (${user.email})`);
    }

    // Create a single project managed by admin, team includes the three standard users
    const projects = [
      {
        name: 'ProjectHub Init',
        description: 'Initial project setup for TechKnoGeeks.',
        status: 'active',
        priority: 'high',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        budget: 0,
        progress: 0,
        manager: createdUsers[0]._id, // Admin
        team: [
          { user: createdUsers[1]._id, role: 'member' }, // Shubham
          { user: createdUsers[2]._id, role: 'member' }, // Samar
          { user: createdUsers[3]._id, role: 'member' }  // Muskan
        ],
        tags: ['techknogeeks']
      }
    ];

    const createdProjects = [];
    for (const projectData of projects) {
      const project = new Project(projectData);
      await project.save();
      createdProjects.push(project);
      console.log(`Created project: ${project.name}`);

      // Update user projects
      await User.findByIdAndUpdate(project.manager, {
        $push: { projects: project._id }
      });

      for (const teamMember of project.team) {
        await User.findByIdAndUpdate(teamMember.user, {
          $push: { projects: project._id }
        });
      }
    }

    // Create a single task in that project
    const tasks = [
      {
        title: 'Initial Task',
        description: 'This is the first task for setup and verification.',
        status: 'todo',
        priority: 'medium',
        type: 'task',
        project: createdProjects[0]._id,
        assignee: createdUsers[1]._id, // Shubham
        reporter: createdUsers[0]._id, // Admin
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        estimatedHours: 4,
        tags: ['init']
      }
    ];

    for (const taskData of tasks) {
      const task = new Task(taskData);
      await task.save();
      console.log(`Created task: ${task.title}`);
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📧 Login credentials:');
    console.log('Admin: admin@projecthub.com / admin123');
    console.log('Standard: shubhamkatoch@techknogeeks.com / shubham123katoch');
    console.log('Standard: samar@techknogeeks.com / samar123marwaha');
    console.log('Standard: muskan@techknogeeks.com / muskan123dhillon');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedData();
