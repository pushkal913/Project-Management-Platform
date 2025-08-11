# 🚀 ProjectHub Setup Guide

Welcome to ProjectHub! This guide will help you set up and run your project management platform.

## 📋 Prerequisites

Before you begin, make sure you have the following installed on your system:

### 1. Node.js and npm
- **Download**: Visit [nodejs.org](https://nodejs.org/)
- **Recommended Version**: Node.js 18.x or higher (includes npm)
- **Installation**: Download the Windows installer and follow the setup wizard
- **Verify Installation**:
  ```bash
  node --version
  npm --version
  ```

### 2. MongoDB
Choose one of these options:

#### Option A: MongoDB Atlas (Cloud - Recommended for beginners)
1. Visit [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update the `MONGODB_URI` in `server/.env`

#### Option B: Local MongoDB Installation
1. Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Install MongoDB Community Server
3. Start MongoDB service
4. Use default connection: `mongodb://localhost:27017/project_management`

### 3. Git (Optional but recommended)
- Download from [git-scm.com](https://git-scm.com/)
- Used for version control

## 🛠️ Installation Steps

### Step 1: Install Dependencies

Open Command Prompt or PowerShell in the project root directory and run:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root directory
cd ..
```

### Step 2: Environment Configuration

1. The `.env` file is already created in the `server` directory
2. Update the MongoDB connection string if needed:
   ```
   MONGODB_URI=mongodb://localhost:27017/project_management
   ```
3. Change the JWT secret for production:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

### Step 3: Database Setup (Optional - Sample Data)

To populate your database with sample data for testing:

```bash
cd server
npm run seed
```

This will create:
- 6 sample users with different roles
- 3 sample projects
- 10+ sample tasks
- Realistic project management scenarios

### Step 4: Start the Application

#### Option A: Start Both Services Together (Recommended)
```bash
# From the root directory
npm run dev
```

#### Option B: Start Services Separately
```bash
# Terminal 1 - Start Backend
cd server
npm run dev

# Terminal 2 - Start Frontend
cd client
npm start
```

### Step 5: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 👥 Sample Login Credentials

After running the seed script, you can use these accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@projecthub.com | admin123 | Full system access |
| Standard | shubhamkatoch@techknogeeks.com | shubham123katoch | Standard user – can create/edit tasks and view all project/task details |
| Standard | samar@techknogeeks.com | samar123marwaha | Standard user – can create/edit tasks and view all project/task details |
| Standard | muskan@techknogeeks.com | muskan123dhillon | Standard user – can create/edit tasks and view all project/task details |

## 🔧 Troubleshooting

### Common Issues

#### 1. "npm is not recognized"
- **Solution**: Install Node.js from nodejs.org
- **Verify**: Run `node --version` and `npm --version`

#### 2. "Cannot connect to MongoDB"
- **Check**: MongoDB service is running
- **Verify**: Connection string in `.env` file
- **Alternative**: Use MongoDB Atlas (cloud)

#### 3. "Port already in use"
- **Backend (5000)**: Change PORT in `server/.env`
- **Frontend (3000)**: React will suggest an alternative port

#### 4. "Module not found" errors
- **Solution**: Delete `node_modules` and run `npm install` again
- **Clean install**: `npm ci` instead of `npm install`

### Performance Tips

1. **Development Mode**: Use `npm run dev` for hot reloading
2. **Production Build**: Run `npm run build` in client folder
3. **Database Indexing**: Indexes are already configured in models
4. **Memory Usage**: Close unused browser tabs during development

## 📱 Features Overview

### Dashboard
- Real-time project and task statistics
- Team workload visualization
- Recent activity feed
- Upcoming deadlines

### Project Management
- Create and manage projects
- Team assignment and collaboration
- Progress tracking with visual indicators
- Budget and timeline management

### Task Management
- Kanban-style workflow (To Do → In Progress → Review → Testing → Done)
- Priority levels and task types
- Comments and collaboration
- Subtasks and checklists
- Due date tracking with overdue alerts

### User Management
- Role-based access control
- Team member management (Admin/Manager only)
- Profile management
- Activity tracking

### Real-time Features
- Live updates using WebSocket
- Instant notifications
- Collaborative editing
- Team activity feeds

## 🚀 Next Steps

1. **Explore the Platform**: Login and navigate through different sections
2. **Create Your First Project**: Use the "New Project" button
3. **Add Team Members**: Invite your colleagues (Admin/Manager role)
4. **Customize Settings**: Update your profile and preferences
5. **Start Managing**: Create tasks, assign team members, track progress

## 📞 Support

If you encounter any issues:

1. **Check this guide** for common solutions
2. **Review the logs** in your terminal/command prompt
3. **Verify prerequisites** are properly installed
4. **Check network connectivity** for database connections

## 🎯 Production Deployment

For production deployment:

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use MongoDB Atlas or dedicated server
3. **Security**: Update JWT secrets and enable HTTPS
4. **Process Manager**: Use PM2 for Node.js process management
5. **Reverse Proxy**: Configure nginx for better performance
6. **Monitoring**: Set up logging and monitoring tools

---

**Congratulations!** 🎉 Your ProjectHub platform is ready to streamline your team's project management workflow!
