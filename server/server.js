// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server: SocketIo } = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// Import configurations and utilities
const config = require('./config/config');
const { authenticateSocket } = require('./middleware/auth');
const SocketHandler = require('./socket/socketHandler');

// Import controllers
const authController = require('./controllers/authController');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS
const io = new SocketIo(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Protected routes
app.get('/api/auth/profile', authController.getProfile);
app.put('/api/auth/profile', authController.updateProfile);

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const fileData = {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer.toString('base64')
    };

    res.json({
      success: true,
      data: fileData
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'File upload failed' 
    });
  }
});

// Initialize default rooms
const initializeDefaultRooms = () => {
  Message.createRoom('global', 'Global Chat', 'system');
  Message.createRoom('general', 'General', 'system');
  Message.createRoom('random', 'Random', 'system');
  Message.createRoom('help', 'Help & Support', 'system');
};

// Initialize default users for testing
const initializeDefaultUsers = async () => {
  // Create some default users for testing
  const defaultUsers = [
    { username: 'admin', password: 'admin123', email: 'admin@chat.com' },
    { username: 'john', password: 'john123', email: 'john@chat.com' },
    { username: 'jane', password: 'jane123', email: 'jane@chat.com' }
  ];

  for (const user of defaultUsers) {
    const existingUser = User.getUserByUsername(user.username);
    if (!existingUser) {
      await User.createUser(user.username, user.password, user.email);
    }
  }
};

// Socket.io authentication middleware
io.use(authenticateSocket);

// Initialize socket handler
const socketHandler = new SocketHandler(io);

// Handle socket connections
io.on('connection', (socket) => {
  socketHandler.handleConnection(socket);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
    onlineUsers: socketHandler.onlineUsers.size
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize default data
    initializeDefaultRooms();
    await initializeDefaultUsers();
    
    server.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`📡 Socket.io server ready`);
      console.log(`🌐 CORS enabled for: ${config.CORS_ORIGIN}`);
      console.log(`🔐 JWT authentication enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io }; 