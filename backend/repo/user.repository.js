const { User } = require('../models');

class UserRepository {
    async findById(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    async findByIds(userIds) {
        return User.findAll({
            where: { id: userIds }
        });
    }
    
    async findByEmail(email) {
        return User.findOne({ where: { email } });
    }

    async findByPermissionId(permissionId) {
        return User.findOne({ where: { permissionId } });
    }

    async create(userData) {
        return User.create(userData);
    }

    async update(userId, updateData) {
        const user = await this.findById(userId);
        return user.update(updateData);
    }

    async updateStats(userId) {
        const user = await this.findById(userId);
        return user.updateStats();
    }

    async findOrCreate(userData) {
        return User.findOrCreate({
            where: { permissionId: userData.permissionId },
            defaults: userData
        });
    }
}

module.exports = new UserRepository();