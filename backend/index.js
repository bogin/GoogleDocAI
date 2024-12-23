// index.js or app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const validateDatabaseConnection = require('./services/postgres.db.service');
const googleService = require('./services/google.service');
const { redisClient } = require('./config/redis.config');
const syncQueue = require('./services/queue');
const etlService = require('./services/etl.service');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:8080'
}));
app.use('/', routes);

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
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
  const app = express();

  const isDbConnected = await validateDatabaseConnection();
  if (!isDbConnected) throw new Error('Database connection failed');

  const isRedisConnected = await validateRedisConnection();
  if (!isRedisConnected) throw new Error('Redis connection failed');

  app.use(express.json());
  app.use(cors({ origin: 'http://localhost:8080' }));
  app.use('/', routes);

  const server = app.listen(port, () => {
    console.log(`API Server running on port ${port}`);
  });

  await Promise.all([
    googleService.initialize(),
    etlService.initialize(),
    syncQueue.initialize()
  ]);


  googleService.on('authenticated', (auth) => {
    etlService.setAuth(auth);
    syncQueue.setInitialized(true);
  });

  return server;
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer().catch(error => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});