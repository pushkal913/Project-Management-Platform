const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management';
console.log('Using MongoDB URI:', MONGODB_URI);

const backupData = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB for backup');

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate timestamp for backup files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Backup Users
    const users = await User.find({}).lean();
    const usersBackupPath = path.join(backupDir, `users_backup_${timestamp}.json`);
    fs.writeFileSync(usersBackupPath, JSON.stringify(users, null, 2));
    console.log(`✅ Users backed up to: ${usersBackupPath}`);
    console.log(`   Total users: ${users.length}`);

    // Backup Projects
    const projects = await Project.find({}).populate('manager team.user').lean();
    const projectsBackupPath = path.join(backupDir, `projects_backup_${timestamp}.json`);
    fs.writeFileSync(projectsBackupPath, JSON.stringify(projects, null, 2));
    console.log(`✅ Projects backed up to: ${projectsBackupPath}`);
    console.log(`   Total projects: ${projects.length}`);

    // Backup Tasks
    const tasks = await Task.find({}).populate('assignee reporter project').lean();
    const tasksBackupPath = path.join(backupDir, `tasks_backup_${timestamp}.json`);
    fs.writeFileSync(tasksBackupPath, JSON.stringify(tasks, null, 2));
    console.log(`✅ Tasks backed up to: ${tasksBackupPath}`);
    console.log(`   Total tasks: ${tasks.length}`);

    // Create a combined backup file
    const combinedBackup = {
      timestamp: new Date().toISOString(),
      users,
      projects,
      tasks
    };
    const combinedBackupPath = path.join(backupDir, `complete_backup_${timestamp}.json`);
    fs.writeFileSync(combinedBackupPath, JSON.stringify(combinedBackup, null, 2));
    console.log(`✅ Complete backup created: ${combinedBackupPath}`);

    console.log('\n🎉 Backup completed successfully!');
    console.log(`📁 Backup location: ${backupDir}`);
    
  } catch (error) {
    console.error('❌ Error creating backup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the backup function
backupData();
