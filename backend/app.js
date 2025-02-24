require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const ipcRoutes = require("./routes/ipcRoutes");
const extractionRoutes = require('./routes/extractionRoutes');
const analysisHistoryRoutes = require('./routes/analysisHistory');
const lawyerRoutes = require('./routes/lawyerRoutes');

// Add detailed error logging
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

// Log environment variables (remove sensitive data in production)
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  CREDENTIALS_PATH: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  PORT: process.env.PORT
});

try {
  // Verify required environment variables
  const requiredEnvVars = [
    'GOOGLE_CLOUD_PROJECT_ID',
    'GOOGLE_APPLICATION_CREDENTIALS',
    'PORT'
  ];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      console.error(`Missing required environment variable: ${varName}`);
      process.exit(1);
    }
  });

  const app = express();

  // Middleware setup - IMPORTANT: These must come before routes
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // API Routes - Move this BEFORE error handlers
  app.use('/api/ipc', ipcRoutes);
  app.use('/api', extractionRoutes);
  app.use('/api', analysisHistoryRoutes);
  app.use('/api/lawyers', lawyerRoutes);
  app.use('/api/v1/lawyers', lawyerRoutes);

  // Socket.IO setup
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000", // Update this to match your frontend port
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Make io accessible to our router
  app.set("io", io);

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    
    socket.on("join_room", (roomId) => {
      console.log("Client joining room:", roomId);
      socket.join(roomId);
    });

    socket.on("send_message", (message) => {
      console.log("Broadcasting message to room:", message.chatRoomId);
      socket.to(message.chatRoomId).emit("new_message", message);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Add route logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Error handling middleware - AFTER routes, but BEFORE 404
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  });

  // 404 handler - This should be LAST
  app.use((req, res) => {
    console.log(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.url}`
    });
  });

  // Start server
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Google Cloud Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('Credentials path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  });

  module.exports = app;

} catch (error) {
  console.error('Startup Error:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
