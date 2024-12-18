const { File } = require('../models');
const { Op } = require('sequelize');

class FilesRepository {
    async findAll({ page, size, query, filters }) {
        const whereConditions = {};

        // Handle query search across multiple fields
        if (query) {
            whereConditions[Op.or] = [
                { name: { [Op.iLike]: `%${query}%` } },
                { owner: { [Op.iLike]: `%${query}%` } }
            ];
        }

        // Handle additional filters
        if (filters) {
            if (filters.mimeType) whereConditions.mimeType = filters.mimeType;
            if (filters.owner) whereConditions.owner = filters.owner;
            if (filters.minSize) whereConditions.size = { [Op.gte]: filters.minSize };
            if (filters.maxSize) whereConditions.size = {
                ...whereConditions.size,
                [Op.lte]: filters.maxSize
            };
        }

        const { count, rows: files } = await File.findAndCountAll({
            where: whereConditions,
            limit: size,
            offset: (page - 1) * size,
            order: [['modifiedTime', 'DESC']]
        });

        return {
            files,
            pagination: {
                currentPage: page,
                pageSize: size,
                totalItems: count,
                totalPages: Math.ceil(count / size)
            }
        };
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