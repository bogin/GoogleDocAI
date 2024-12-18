// index.js or app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const initializeServices = require('./services/initialize.service');
const validateDatabaseConnection = require('./services/db.service');
const googleService = require('./services/google.service');

const app = express();
const port = process.env.PORT || 3000;

// Express middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:8080'
}));
app.use('/', routes);

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};
app.use(errorHandler);

async function startServer() {
  try {
    // Only initialize what's needed for API
    const isDbConnected = await validateDatabaseConnection();
    if (!isDbConnected) {
      throw new Error('Database connection failed');
    }
    console.log('Database connected successfully');

    // Initialize Google Auth for API endpoints
    const auth = await googleService.initializeGoogleAuth();
    if (!auth) {
      console.error('Google authentication failed');
    } else {
      console.log('Google Auth initialized successfully');
    }

    app.listen(port, () => {
      console.log(`API Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}


// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  // Add cleanup logic here if needed
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  // Add cleanup logic here if needed
  process.exit(0);
});

// Start the application
startServer().catch(error => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});