const { FileOwner, User } = require('../models');

class FileOwnerRepository {
    async findByFileId(fileId) {
        return FileOwner.findAll({
            where: { fileId },
            include: [{ model: User }]
        });
    }

    async findOrCreate({ fileId, userId, permissionRole }) {
        return FileOwner.findOrCreate({
            where: { fileId, userId },
            defaults: { permissionRole }
        });
    }

    async findByUserIdAndFileId(userId, fileId) {
        return FileOwner.findOne({
            where: { userId, fileId }
        });
    }

    async create(ownerData) {
        return FileOwner.create(ownerData);
    }

    async delete(userId, fileId) {
        return FileOwner.destroy({
            where: { userId, fileId }
        });
    }

    async findOrCreate(ownerData) {
        return FileOwner.findOrCreate({
            where: {
                fileId: ownerData.fileId,
                userId: ownerData.userId
            },
            defaults: ownerData
        });
    }

    async isLastOwner(fileId) {
        return FileOwner.isLastOwner(fileId);
    }

    async deleteByFileId(fileId, transaction) {
        return FileOwner.destroy({
            where: { file_id: fileId },
            transaction
        });
    }

    async userHasFiles(userId, transaction) {
        const count = await FileOwner.count({
            where: { user_id: userId },
            transaction
        });
        return count > 0;
    }
}

module.exports = new FileOwnerRepository();