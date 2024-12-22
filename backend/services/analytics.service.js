const { File, User, FileOwner } = require('../models'); // Make sure you include all models
const openAIService = require('./openai-analytics.service');

class AnalyticsService {
    async analyzeQuery(query) {
        let queryConfig;
        try {
            // Generate query configuration from OpenAI Service
            queryConfig = await openAIService.generateQuery({
                query
            });

            // Validate the generated query configuration
            await this.validateQuery(queryConfig);

            if (!queryConfig || !queryConfig.model || !queryConfig.function || !queryConfig.params) {
                throw new Error('Invalid query configuration generated');
            }

            // Use dynamic method call to execute the query
            const result = await this.executeQuery(queryConfig);

            // Format the result
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

    // Execute query based on the dynamic model and function
    async executeQuery(queryConfig) {
        const { model, function: method, params } = queryConfig;

        if (!model || !method || !params) {
            throw new Error('Missing query configuration for model, method, or params');
        }

        const modelInstance = this.getModelInstance(model);
        
        // Dynamically call the method with the params
        return modelInstance[method](params);
    }

    // Dynamically fetch the correct model
    getModelInstance(model) {
        switch (model) {
            case 'File': return File;
            case 'User': return User;
            case 'FileOwner': return FileOwner;
            default: throw new Error(`Unknown model: ${model}`);
        }
    }

    async validateQuery(queryConfig) {
        // Validate the possible methods and parameters
        const validMethods = ['findAll', 'findOne', 'count', 'findAndCountAll'];

        if (!validMethods.includes(queryConfig.function)) {
            throw new Error(`Invalid method: ${queryConfig.function}`);
        }

        if (!queryConfig.params || typeof queryConfig.params !== 'object') {
            throw new Error('Invalid params configuration');
        }

        return true;
    }
}

module.exports = new AnalyticsService();
