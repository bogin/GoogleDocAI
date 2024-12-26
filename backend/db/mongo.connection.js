const mongoose = require('mongoose');
const FileContent = require('../mongoModels/file.model');
require('dotenv').config();

const connectToMongoDB = async () => {
    try {
        const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/files';
        const connection = await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        if (connection.connections[0].readyState !== 1) {
            throw new Error('MongoDB connection is not ready. Ensure MongoDB is running and connected.');
        }

        await FileContent.init();
        return true;
    } catch (error) {
        console.error('Unable to connect to the mongo database:');
        return false;
    } finally {
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Mongoose connection closed on application termination.');
            process.exit(0);
        });
    }
};

module.exports = { connectToMongoDB };
