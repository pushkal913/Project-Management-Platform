# ProjectHub - Project Management Platform

A comprehensive project management platform built for teams up to 10 employees, similar to Zoho Projects and Jira.

## Features

### 🎯 Core Functionality
- **Dashboard**: Real-time overview of projects, tasks, and team performance
- **Project Management**: Create, manage, and track projects with full lifecycle support
- **Task Management**: Comprehensive task tracking with status, priority, assignments, and dependencies
- **User Management**: Role-based access control with different permission levels
- **Real-time Updates**: Live notifications and updates using WebSocket connections

### 👥 User Roles
- **Admin**: Full system access, user management, all projects
- **Manager**: Project creation, team management, reporting
- **Developer**: Task management, project participation
- **Tester**: Testing tasks, quality assurance
- **Viewer**: Read-only access to assigned projects

### 📊 Project Features
- Project status tracking (Planning, Active, On-hold, Completed, Cancelled)
- Progress monitoring with visual indicators
- Team assignment and collaboration
- Budget tracking
- Timeline management with start/end dates
- Tag-based organization

### ✅ Task Features
- Multiple task types (Feature, Bug, Improvement, Task, Story)
- Priority levels (Low, Medium, High, Critical)
- Status workflow (To Do → In Progress → Review → Testing → Done)
- Assignee management
- Due date tracking with overdue alerts
- Time estimation and tracking
- Subtasks and checklists
- Comments and collaboration
- File attachments support

### 📈 Analytics & Reporting
- Task distribution charts
- Project progress analytics
- Team workload visualization
- Performance metrics
- Activity timelines

## Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time updates
- **bcryptjs** for password hashing
- **Express-validator** for input validation

### Frontend
- **React 18** with functional components and hooks
- **Material-UI (MUI)** for modern, responsive UI
- **React Router** for navigation
- **Axios** for API communication
- **Recharts** for data visualization
- **React Toastify** for notifications
- **Formik & Yup** for form handling

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/project_management
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Quick Start (Both Backend & Frontend)
From the root directory:
```bash
npm run install-all
npm run dev
```

## Usage

### Getting Started
1. Access the application at `http://localhost:3000`
2. Register a new account or login with existing credentials
3. Create your first project
4. Add team members and assign tasks
5. Track progress through the dashboard

### User Management
- Admins can manage all users and assign roles
- Managers can oversee projects and team members
- Team members can collaborate on assigned projects and tasks

### Project Workflow
1. **Planning Phase**: Create project, define scope, assign team
2. **Active Phase**: Create and manage tasks, track progress
3. **Monitoring**: Use dashboard for real-time insights
4. **Completion**: Mark project as completed, generate reports

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/team` - Add team member

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/comments` - Add comment

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard data
- `GET /api/dashboard/analytics/tasks` - Get task analytics
- `GET /api/dashboard/analytics/projects` - Get project analytics

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Rate limiting (recommended for production)

## Performance Features
- Database indexing for optimal queries
- Real-time updates with Socket.io
- Responsive design for all devices
- Lazy loading and code splitting
- Optimized API responses

## Deployment

### Production Environment
1. Set `NODE_ENV=production` in your environment
2. Use a production MongoDB instance
3. Configure proper JWT secrets
4. Set up SSL/HTTPS
5. Use a process manager like PM2
6. Configure reverse proxy (nginx)

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
This project is licensed under the MIT License.

## Support
For support and questions, please create an issue in the repository or contact the development team.

---

**ProjectHub** - Streamlining project management for small to medium teams.
