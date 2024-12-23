const { File, User, FileOwner } = require('../models');
const openAIService = require('./openai/openai-analytics.service');

class AnalyticsService {
    async analyzeQuery(query) {
        let queryConfig;
        try {
            queryConfig = await openAIService.generateQuery({
                query
            });

            await this.validateQuery(queryConfig);

            if (!queryConfig || !queryConfig.model || !queryConfig.function || !queryConfig.params) {
                throw new Error('Invalid query configuration generated');
            }

            const result = await this.executeQuery(queryConfig);

            return {
                success: true,
                query: query,
                method: queryConfig.function,
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

    async executeQuery(queryConfig) {
        const { model, function: method, params } = queryConfig;

        if (!model || !method || !params) {
            throw new Error('Missing query configuration for model, method, or params');
        }

        const modelInstance = this.getModelInstance(model);

        return modelInstance[method](params);
    }

    getModelInstance(model) {
        switch (model) {
            case 'File': return File;
            case 'User': return User;
            case 'FileOwner': return FileOwner;
            default: throw new Error(`Unknown model: ${model}`);
        }
    }

    async validateQuery(queryConfig) {
        if (!queryConfig.params || typeof queryConfig.params !== 'object') {
            throw new Error('Invalid params configuration');
        }

        return true;
    }
}

module.exports = new AnalyticsService();
