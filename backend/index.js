require('dotenv').config();
const express = require('express');
const routes = require('./routes/index');
const GoogleService = require('./services/google.service');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/', routes);


const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
}

app.use(errorHandler);
const cors = require('cors')

app.use(cors({
  origin: 'http://localhost:8080' // Vue.js dev server
}))

async function startServer() {
  try {
    await GoogleService.initializeGoogleAuth();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();