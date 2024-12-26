const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class File extends Model {
        static associate(models) {
            File.hasMany(models.FileOwner, {
                foreignKey: 'file_id',
                as: 'fileOwners',
            });
        }


        async safeDelete(userId) {
            await sequelize.models.FileOwner.destroy({
                where: {
                    file_id: this.id,
                    user_id: userId
                }
            });

            const remainingOwners = await sequelize.models.FileOwner.count({
                where: { file_id: this.id }
            });

            if (remainingOwners === 0) {
                return this.destroy();
            }

            return this;
        }
    }

    File.init({
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        mimeType: {
            type: DataTypes.STRING,
            allowNull: true
        },
        iconLink: {
            type: DataTypes.STRING,
            allowNull: true
        },
        webViewLink: {
            type: DataTypes.STRING,
            allowNull: true
        },
        size: {
            type: DataTypes.STRING,
            allowNull: true
        },
        shared: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        trashed: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        createdTime: {
            type: DataTypes.DATE,
            allowNull: true
        },
        modifiedTime: {
            type: DataTypes.DATE,
            allowNull: true
        },
        version: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lastModifyingUser: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        permissions: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        capabilities: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        syncStatus: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending'
        },
        lastSyncAttempt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        errorLog: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'File',
        tableName: 'files',
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            {
                fields: ['sync_status']
            },
            {
                fields: ['modified_time']
            },
            {
                fields: ['created_time']
            },
            {
                fields: ['last_sync_attempt']
            },
            {
                fields: ['trashed']
            },
        ]
    });

    File.prototype.isEditable = function () {
        return this.capabilities?.canEdit || false;
    };

    return File;
};