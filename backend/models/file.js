const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class File extends Model {
        static associate(models) {
            // define associations here if needed
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
        modifiedTime: {
            type: DataTypes.DATE,
            allowNull: true
        },
        owner: {
            type: DataTypes.STRING,
            allowNull: true
        },
        size: {
            type: DataTypes.BIGINT,
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
        underscored: true
    });

    return File;
};