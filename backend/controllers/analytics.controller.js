const { validationResult, body } = require('express-validator');
const analyticsService = require('../services/analytics.service');

class AnalyticsController {
    async analyzeFiles(req, res) {
        try {
            // Input validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { query } = req.body;

            // Additional validation
            if (typeof query !== 'string' || query.length > 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid query format or length'
                });
            }

            const result = await analyticsService.analyzeQuery(query);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.json(result);

        } catch (error) {
            console.error('Analytics controller error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

module.exports = new AnalyticsController();