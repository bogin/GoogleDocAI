const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class FileOwner extends Model {
        static associate(models) {
            // associations can be defined here
            FileOwner.belongsTo(models.File, {
                foreignKey: 'file_id',
                onDelete: 'CASCADE'
            });
            FileOwner.belongsTo(models.User, {
                foreignKey: 'user_id',
                onDelete: 'CASCADE'
            });
        }

        static async isLastOwner(fileId) {
            return (await this.count({ where: { fileId } })) === 1;
        }
    }

    FileOwner.init({
        fileId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_id',
            references: {
                model: 'files',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        permissionRole: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'reader',
            field: 'permission_role'
        }
    }, {
        sequelize,
        modelName: 'FileOwner',
        tableName: 'file_owners',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['file_id', 'user_id']
            }
        ]
    });

    return FileOwner;
};