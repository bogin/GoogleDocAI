const analyticsService = require('../services/analytics.service');

class AnalyticsController {
    async analyzeFiles(req, res) {
        try {
            const { query } = req.body;
            

            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Query is required'
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
                error: 'Failed to process analytics query'
            });
        }
    }
}

module.exports = new AnalyticsController();