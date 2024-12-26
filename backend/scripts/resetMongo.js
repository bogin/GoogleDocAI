const mongoose = require('mongoose');
require('dotenv').config();

const resetMongoDB = async () => {
    try {
        const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/files';
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB. Dropping database...');
        await mongoose.connection.dropDatabase();
        console.log('Database reset successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Error resetting MongoDB database:');
        process.exit(1);
    }
};

resetMongoDB();
