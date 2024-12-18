const express = require('express');
const googleService = require('../services/google.service');
const { initializeServices } = require('../services/initialize.service');

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
    const servicesInitialized = await initializeServices(auth);
    if (!servicesInitialized) {
      console.error('Failed to initialize services');
    }
    res.send('Authentication successful! You can close this window.');
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;