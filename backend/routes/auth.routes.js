const express = require('express');
const googleService = require('../services/google.service');
const etlService = require('../services/etl.service');
const smartQueue = require('../queue/smart.queue');

const router = express.Router();

router.get('/google', (req, res) => {
  const authUrl = googleService.getAuthUrl();
  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    await googleService.setCredentials(code);
    const auth = googleService.getAuth();
    if (auth) {
      etlService.setAuth(auth);
      smartQueue.setInitialized(true);
      console.log('Successfully authenticated and initialized services');
    }
    res.send('Authentication successful! You can close this window.');
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});


module.exports = router;