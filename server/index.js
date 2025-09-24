const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const documentRoutes = require('./routes/documents');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://project-management-platform-gs9ak41r.vercel.app",
      "https://project-management-platform-teal.vercel.app",
      "https://project-management-platform-ye0w.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: false
  },
  transports: ['websocket', 'polling']
});

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://project-management-platform-gs9ak41r.vercel.app",
      "https://project-management-platform-teal.vercel.app", 
      "https://project-management-platform-ye0w.onrender.com"
    ];
    
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: false,
  optionsSuccessStatus: 200,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
};

// Add debugging middleware before CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add explicit preflight handling
app.options('*', cors(corsOptions));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('origin')}`);
  next();
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  // Check if we need to seed data
  const User = require('./models/User');
  const userCount = await User.countDocuments();
  console.log(`Found ${userCount} users in database`);
  
  if (userCount === 0) {
    console.log('No users found, database might need seeding');
    console.log('Run: npm run seed to create default admin user');
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });
  
  socket.on('task-update', (data) => {
    socket.to(`project-${data.projectId}`).emit('task-updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentRoutes);

// API health check
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ProjectHub API is running', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/auth', '/api/users', '/api/projects', '/api/tasks', '/api/dashboard', '/api/documents']
  });
});

// Root health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ProjectHub API is running', 
    timestamp: new Date().toISOString(),
    endpoints: ['/api/auth', '/api/users', '/api/projects', '/api/tasks', '/api/dashboard', '/api/documents']
  });
});

// Create admin user endpoint (for testing) - SAFE, won't affect existing data
app.get('/create-admin', async (req, res) => {
  try {
    const User = require('./models/User');
    
    // Count total users
    const totalUsers = await User.countDocuments();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@projecthub.com' });
    if (existingAdmin) {
      return res.json({ 
        message: 'Admin user already exists', 
        email: 'admin@projecthub.com',
        totalUsers: totalUsers,
        status: 'exists'
      });
    }
    
    // Create admin user (SAFE - only creates if doesn't exist)
    const admin = new User({
      name: 'Admin User',
      email: 'admin@projecthub.com',
      password: 'admin123',
      role: 'admin',
      department: 'Management',
      position: 'System Administrator',
      phone: '+1-555-0001',
      isActive: true
    });
    
    await admin.save();
    const newTotal = await User.countDocuments();
    
    res.json({ 
      message: 'Admin user created successfully', 
      email: 'admin@projecthub.com', 
      password: 'admin123',
      totalUsers: newTotal,
      status: 'created'
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Database connection or model issue'
    });
  }
});

// Check database status
app.get('/db-status', async (req, res) => {
  try {
    const User = require('./models/User');
    const Project = require('./models/Project');
    const Task = require('./models/Task');
    
    const userCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();
    const taskCount = await Task.countDocuments();
    
    const adminExists = await User.findOne({ email: 'admin@projecthub.com' });
    
    res.json({
      database: 'connected',
      users: userCount,
      projects: projectCount,
      tasks: taskCount,
      adminUserExists: !!adminExists,
      mongoUri: process.env.MONGODB_URI ? 'configured' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({
      database: 'error',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
