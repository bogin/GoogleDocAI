const { File } = require('../models');
const { Op } = require('sequelize');
const openaiService = require('../services/openai.service');

class FilesRepository {

    async findAll({ page = 1, size = 10, query, filters = {} }) {
        try {
            // Base query configuration
            let queryConfig = {
                where: {},
                limit: size,
                offset: (page - 1) * size,
                order: [['modifiedTime', 'DESC']],
            };

            // Add modifiedAfter filter directly to queryConfig (don't pass to AI)
            if (filters.modifiedAfter) {
                queryConfig.where.modifiedTime = {
                    [Op.gte]: new Date(filters.modifiedAfter),
                };
            }

            // If a query string exists, use the AI service to generate a query
            if (filters?.query) {
                try {
                    const aiQueryConfig = await openaiService.generateQuery({
                        query: filters.query,
                        page,
                        size,
                        baseConfig: queryConfig, // Pass only baseConfig and query
                    });

                    // Merge the AI query with the baseConfig here, not inside AI service
                    queryConfig = {
                        ...queryConfig,  // Retain all properties from the base config

                        where: {
                            [Op.and]: [
                                queryConfig.where,      // Base 'where' conditions
                                aiQueryConfig.where,    // AI-generated 'where' conditions
                            ],
                        },

                        // Merge 'order' (if AI has no order, use the default)
                        order: aiQueryConfig.order || queryConfig.order,
                    };
                } catch (error) {
                    throw new Error(`Invalid query parameters: ${error.message}`);
                }
            }

            // Execute the query
            const { count, rows: files } = await File.findAndCountAll(queryConfig);

            return {
                files,
                pagination: {
                    currentPage: page,
                    pageSize: size,
                    totalItems: count,
                    totalPages: Math.ceil(count / size),
                    hasNextPage: page * size < count,
                },
            };
        } catch (error) {
            throw new Error(`Failed to find files: ${error.message}`);
        }
    }

    async findById(fileId) {
        const file = await File.findByPk(fileId);
        if (!file) {
            throw new Error('File not found');
        }
        return file;
    }

    async create(fileData) {
        return await File.create(fileData);
    }

    async update(fileId, updateData) {
        const file = await this.findById(fileId);
        return await file.update(updateData);
    }

    async delete(fileId) {
        const file = await this.findById(fileId);
        await file.destroy();
        return true;
    }
}

module.exports = new FilesRepository();