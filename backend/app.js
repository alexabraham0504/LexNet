require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const ipcRoutes = require("./routes/ipcRoutes");
const extractionRoutes = require('./routes/extractionRoutes');
const analysisHistoryRoutes = require('./routes/analysisHistory');
const caseRoutes = require('./routes/caseRoutes');
const casesRouter = require('./routes/cases');
const http = require('http');
const socketIo = require('socket.io');
const lawyerRoutes = require('./routes/lawyerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const lawyerRegistrationRoutes = require('./routes/lawyerRegistrationRoutes');




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
  app.use(cors({
    origin: "http://localhost:3000", // Or use an array of allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Add this before your routes
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Add request logging middleware before routes
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });

  // API Routes - Move this BEFORE error handlers
  app.use('/api/ipc', ipcRoutes);
  app.use('/api', extractionRoutes);
  app.use('/api', analysisHistoryRoutes);
  app.use('/api/cases', caseRoutes);
  app.use('/cases', casesRouter);
  app.use('/api/lawyers', lawyerRoutes);
  app.use('/api/lawyer-registration', lawyerRegistrationRoutes);
 

  // Add error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      success: false,
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
