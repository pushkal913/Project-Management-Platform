const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management';

const restoreData = async (backupFileName) => {
  try {
    if (!backupFileName) {
      console.error('❌ Please provide a backup file name');
      console.log('Usage: node scripts/restoreData.js <backup_file_name>');
      console.log('Example: node scripts/restoreData.js complete_backup_2025-08-15T10-30-00-000Z.json');
      process.exit(1);
    }

    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFilePath = path.join(backupDir, backupFileName);

    if (!fs.existsSync(backupFilePath)) {
      console.error(`❌ Backup file not found: ${backupFilePath}`);
      console.log('Available backup files:');
      if (fs.existsSync(backupDir)) {
        const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
        files.forEach(file => console.log(`  - ${file}`));
      }
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB for restore');

    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    console.log(`📁 Reading backup from: ${backupFilePath}`);
    console.log(`📅 Backup timestamp: ${backupData.timestamp}`);

    // Ask for confirmation before proceeding
    console.log('\n⚠️  WARNING: This will replace ALL existing data with backup data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🔄 Starting restore process...');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log('✅ Cleared existing data');

    // Restore Users
    if (backupData.users && backupData.users.length > 0) {
      await User.insertMany(backupData.users);
      console.log(`✅ Restored ${backupData.users.length} users`);
    }

    // Restore Projects
    if (backupData.projects && backupData.projects.length > 0) {
      await Project.insertMany(backupData.projects);
      console.log(`✅ Restored ${backupData.projects.length} projects`);
    }

    // Restore Tasks
    if (backupData.tasks && backupData.tasks.length > 0) {
      await Task.insertMany(backupData.tasks);
      console.log(`✅ Restored ${backupData.tasks.length} tasks`);
    }

    console.log('\n🎉 Data restored successfully!');
    
  } catch (error) {
    console.error('❌ Error restoring data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Get backup file name from command line arguments
const backupFileName = process.argv[2];
restoreData(backupFileName);
