const { File } = require('../models');
const openAIService = require('./openai.service');

class AnalyticsService {
    async analyzeFiles(query, options = {}) {
        let queryConfig;
        try {
            // Generate query configuration
            queryConfig = await openAIService.generateQuery({
                query,
                ...options
            });

            if (!queryConfig || !queryConfig.method || !queryConfig.params) {
                throw new Error('Invalid query configuration generated');
            }

            // Execute the query using the specified method
            const result = await File[queryConfig.method](queryConfig.params);

            // Format the result
            return {
                success: true,
                query: query,
                method: queryConfig.method,
                result: result,
                metadata: {
                    timestamp: new Date(),
                    queryConfig: queryConfig
                }
            };

        } catch (error) {
            console.error('Analytics query failed:', {
                message: error.message,
                queryConfig: JSON.stringify(queryConfig, null, 4)
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

    async validateQuery(queryConfig) {
        const validMethods = ['findAll', 'findOne', 'count', 'findAndCountAll'];
        
        if (!validMethods.includes(queryConfig.method)) {
            throw new Error(`Invalid method: ${queryConfig.method}`);
        }

        // Validate params based on method
        if (!queryConfig.params || typeof queryConfig.params !== 'object') {
            throw new Error('Invalid params configuration');
        }

        return true;
    }
}

module.exports = new AnalyticsService();