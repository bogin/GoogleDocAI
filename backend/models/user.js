const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.File, {
                foreignKey: 'user_id',
                as: 'files'
            });
        }

        async updateStats() {
            const files = await this.getFiles();
            this.totalFiles = files.length;
            this.totalSize = files.reduce((sum, file) => {
                const size = parseInt(file.size, 10);
                return sum + (isNaN(size) ? 0 : size);
            }, 0);
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