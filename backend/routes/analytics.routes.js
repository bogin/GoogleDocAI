// src/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

router.post('/analyze', analyticsController.analyzeFiles.bind(analyticsController));

module.exports = router;