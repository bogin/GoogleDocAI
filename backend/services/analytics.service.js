const {sequelize} = require('../models');
const openAIService = require('./openai/openai-analytics.service');

class AnalyticsService {
    async analyzeQuery(query) {
        let queryString;
        try {
            queryString = await openAIService.generateQuery({
                query
            });

            const [result, metadata] = await sequelize.query(queryString);
            return {
                success: true,
                query: query,
                result: result,
                metadata: {
                    timestamp: new Date(),
                    queryConfig: queryString
                }
            };

        } catch (error) {
            console.error('Analytics query failed:', {
                message: error.message,
                query: query,
                queryConfig: JSON.stringify(queryString, null, 4)
            });
            return {
                success: false,
                query: query,
                error: error.message,
                metadata: {
                    timestamp: new Date()
                }
            };
        }
    }
}

module.exports = new AnalyticsService();
