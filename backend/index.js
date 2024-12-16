require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const { initializeGoogleAuth } = require('./services/googleService');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', routes);


const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
}

app.use(errorHandler);

async function startServer() {
  try {
    await initializeGoogleAuth();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();