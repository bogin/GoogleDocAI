const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.FileOwner, {
                foreignKey: 'user_id',
                as: 'fileOwners'
            });
        }

        async updateStats() {
            const { sequelize } = this.constructor;

            const stats = await sequelize.models.FileOwner.findAll({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('File.id')), 'total_files'],
                    [sequelize.fn('SUM',
                        sequelize.cast(sequelize.col('File.size'), 'BIGINT')), 'total_size']
                ],
                include: [{
                    model: sequelize.models.File,
                    attributes: [],
                    required: true,
                    where: {
                        deleted_at: null
                    }
                }],
                where: {
                    user_id: this.id
                },
                group: ['FileOwner.user_id'],
                raw: true
            });

            this.totalFiles = stats[0]?.total_files || 0;
            this.totalSize = parseInt(stats[0]?.total_size || 0, 10);

            await this.save();
        }
    }

    User.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        permissionId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            field: 'permission_id'
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        displayName: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'display_name'
        },
        photoLink: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'photo_link'
        },
        totalFiles: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'total_files'
        },
        totalSize: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
            field: 'total_size'
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                fields: ['email']
            },
            {
                fields: ['permission_id']
            }
        ]
    });

    return User;
};