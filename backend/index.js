// index.js or app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const validateDatabaseConnection = require('./services/postgres.db.service');
const googleService = require('./services/google.service');
const { redisClient } = require('./config/redis.config');

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


async function validateRedisConnection() {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    return false;
  }
}

async function startServer() {
  try {
    // Check database connection
    const isDbConnected = await validateDatabaseConnection();
    if (!isDbConnected) {
      throw new Error('Database connection failed');
    }
    console.log('Database connected successfully');

    // Check Redis connection
    const isRedisConnected = await validateRedisConnection();
    if (!isRedisConnected) {
      throw new Error('Redis connection failed');
    }
    console.log('Redis connected successfully');

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

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await redisClient.quit();
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