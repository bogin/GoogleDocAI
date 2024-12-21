const { FileOwner, User, File, sequelize } = require('../models');
const { Op } = require('sequelize');
const openaiService = require('../services/openai.service');
const { isEmpty } = require("lodash");

class FilesRepository {

    async findAll({ page = 1, size = 10, query, filters = {} }) {
        try {
            // Base query configuration
            let queryConfig = {
                where: {},
                limit: size,
                offset: (page - 1) * size,
                order: [['modifiedTime', 'DESC']]
            };

            // Direct filters (not passed to AI)
            if (filters.modifiedAfter) {
                queryConfig.where.modifiedTime = {
                    [Op.gte]: new Date(filters.modifiedAfter),
                };
            }

            // Handle direct permission filters
            if (filters.ownerEmail) {
                queryConfig.where = {
                    ...queryConfig.where,
                    permissions: {
                        [Op.contains]: [{
                            role: 'owner',
                            type: 'user',
                            emailAddress: filters.ownerEmail
                        }]
                    }
                };
            }

            if (filters.shared === true) {
                queryConfig.where = {
                    ...queryConfig.where,
                    permissions: {
                        [Op.contains]: [{
                            type: 'anyone'
                        }]
                    }
                };
            }

            // If a query string exists, use the AI service
            if (filters?.query) {
                try {
                    const aiQueryConfig = await openaiService.generateQuery({
                        query: filters.query,
                        page,
                        size,
                        baseConfig: queryConfig
                    });

                    // Merge the AI-generated where conditions
                    if (aiQueryConfig.where) {
                        let where = [];
                        if (!isEmpty(queryConfig.where)) {
                            where.push(queryConfig.where);
                        }
                        if (!isEmpty(aiQueryConfig.where)) {
                            where.push(aiQueryConfig.where);
                        }

                        queryConfig.where = where.length > 1
                            ? { [Op.and]: where }
                            : where[0] || {};
                    }

                    // Handle order if provided by AI
                    if (aiQueryConfig.order) {
                        queryConfig.order = aiQueryConfig.order;
                    }
                } catch (error) {
                    throw new Error(`Invalid query parameters: ${error.message}`);
                }
            }

            // Execute the query
            const { count, rows: files } = await File.findAndCountAll(queryConfig);

            // Process the files to add computed properties
            const processedFiles = files.map(file => {
                const fileData = file.toJSON();

                // Add computed properties based on permissions
                fileData.owners = file.permissions
                    ?.filter(p => p.role === 'owner' && p.type === 'user')
                    ?.map(p => ({
                        email: p.emailAddress,
                        displayName: p.displayName
                    })) || [];

                fileData.commenters = file.permissions
                    ?.filter(p => p.role === 'commenter')
                    ?.map(p => ({
                        type: p.type,
                        email: p.emailAddress,
                        displayName: p.displayName
                    })) || [];

                fileData.publicAccess = file.permissions
                    ?.find(p => p.type === 'anyone')
                    ?.role || 'none';

                return fileData;
            });

            return {
                files: processedFiles,
                pagination: {
                    currentPage: page,
                    pageSize: size,
                    totalItems: count,
                    totalPages: Math.ceil(count / size),
                    hasNextPage: page * size < count,
                }
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
        // Begin transaction
        const transaction = await sequelize.transaction();

        try {
            // Find the file with its owners
            const file = await File.findByPk(fileId, {
                include: [
                    {
                        model: FileOwner,
                        as: 'fileOwners',
                        include: [{ model: User }]
                    }
                ],
                transaction
            });

            if (!file) {
                throw new Error('File not found');
            }

            // Get unique users associated with this file
            const userOwners = file.fileOwners.map(fo => fo.User);

            // Remove file owners
            await FileOwner.destroy({
                where: { file_id: file.id },
                transaction
            });

            // Soft delete the file
            await file.destroy({ transaction });

            // Check and potentially delete users who have no more files
            for (const user of userOwners) {
                const remainingFiles = await FileOwner.count({
                    where: { user_id: user.id },
                    transaction
                });

                // If no more files, delete the user
                if (remainingFiles === 0) {
                    await user.destroy({ transaction });
                }
            }

            // Commit transaction
            await transaction.commit();

            return {
                message: 'File and potentially associated users removed',
                fileRemoved: true
            };
        } catch (error) {
            // Rollback transaction if anything fails
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new FilesRepository();