const { FileOwner, User, File, sequelize } = require('../models');

const fileOwnerRepository = require('./fileOwner.repository');

class FilesRepository {

    static DEFAULT_USER_INCLUDE = {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'displayName', 'photoLink', 'totalFiles', 'totalSize']
    };

    async findAll(queryConfig) {
        try {
            const { count, rows } = await File.findAndCountAll(queryConfig);
            return { count, rows };
        } catch (error) {
            throw new Error(`Failed to find files: ${error.message}`);
        }
    }

    async findOne({ queryConfig }) {
        try {
            const res = await File.findOne(queryConfig);
            return res;
        } catch (error) {
            throw new Error(`Failed to find file: ${error.message}, ${queryConfig}`);
        }
    }

    async findById(fileId, include = [FilesRepository.DEFAULT_USER_INCLUDE]) {
        const file = await File.findByPk(fileId, {
            include
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

    async upsert(fileData) {
        try {
            const res = await File.upsert(fileData);
            return res;
        } catch (error) {
            throw new Error(`Failed to bulkUpdate: ${error.message}, ${{ where, update }}`);
        }
    }

    async bulkUpdate({ where, update }) {
        try {
            const res = await File.update(
                update,
                {
                    where
                }
            );
            return res;
        } catch (error) {
            throw new Error(`Failed to bulkUpdate: ${error.message}, ${{ where, update }}`);
        }
    }

    async delete(fileId) {
        const transaction = await sequelize.transaction();

        try {
            const file = await this._findFileWithOwners(fileId, transaction);
            const userOwners = file.fileOwners.map(fo => fo.User);

            await fileOwnerRepository.deleteByFileId(file.id, transaction);
            await file.destroy({ transaction });
            await this._cleanupOrphanedUsers(userOwners, transaction);

            await transaction.commit();
            return {
                message: 'File and potentially associated users removed',
                fileRemoved: true
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async _findFileWithOwners(fileId, transaction) {
        const file = await File.findByPk(fileId, {
            include: [{
                model: 'fileOwners',
                include: [{ model: 'User' }]
            }],
            transaction
        });

        if (!file) {
            throw new Error('File not found');
        }

        return file;
    }

    async _cleanupOrphanedUsers(users, transaction) {
        for (const user of users) {
            const hasRemainingFiles = await fileOwnerRepository.userHasFiles(user.id, transaction);
            if (!hasRemainingFiles) {
                await user.destroy({transaction});
            }
        }
    }

    async _findFileWithOwners(fileId, transaction) {
        const file = await File.findByPk(fileId, {
            include: [{
                model: FileOwner,
                as: 'fileOwners',
                include: [{ model: User }]
            }],
            transaction
        });

        if (!file) {
            throw new Error('File not found');
        }

        return file;
    }
}

module.exports = new FilesRepository();