const { File } = require('../models');
const { Op } = require('sequelize');
const openaiService = require('../services/openai.service');
const { isEmpty } = require("lodash");
const { User } = require('../models');

class FilesRepository {

    async findAll({ page = 1, size = 10, query, filters = {} }) {
        try {
            // Base query configuration
            let queryConfig = {
                where: {},
                limit: size,
                offset: (page - 1) * size,
                order: [['modifiedTime', 'DESC']],
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'displayName', 'photoLink', 'totalFiles', 'totalSize'],
                }],
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

                    let where = [];
                    if (!isEmpty(queryConfig.where)) {
                        where.push(queryConfig.where)
                    }
                    if (!isEmpty(aiQueryConfig.where)) {
                        where.push(aiQueryConfig.where)
                    }
                    if (where.length === 2) {
                        where = {
                            [Op.and]: where,
                        }
                    } else if (where.length === 1) {
                        where = where[0];
                    } else {
                        where = {};
                    }
                    // Merge the AI query with the baseConfig here, not inside AI service
                    queryConfig = {
                        ...queryConfig,  // Retain all properties from the base config
                        where,
                        order: aiQueryConfig.order || queryConfig.order,
                    };

                    // Handle any additional includes from AI query while preserving user include
                    if (aiQueryConfig.include) {
                        const existingUserInclude = queryConfig.include.find(inc => inc.as === 'user');
                        const newIncludes = aiQueryConfig.include.filter(inc => inc.as !== 'user');
                        queryConfig.include = [existingUserInclude, ...newIncludes];
                    }
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
        const file = await File.findByPk(fileId, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'displayName', 'photoLink', 'totalFiles', 'totalSize']
            }]
        });

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