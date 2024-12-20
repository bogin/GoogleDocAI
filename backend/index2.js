require('dotenv').config();
const validateDatabaseConnection = require('./services/postgres.db.service');
const googleService = require('./services/google.service');
const etlService = require('./services/etl.service');
const syncQueue = require('./queue/smart.queue');
const fileProcessor = require('./queue/processor');

async function startServer() {
    try {
        // First, validate database connection
        const isDbConnected = await validateDatabaseConnection();
        if (!isDbConnected) {
            throw new Error('Database connection failed');
        }
        console.log('Database connected successfully');

        // Set up processor for queue
        syncQueue.setProcessor(fileProcessor);

        // Try to authenticate first
        const auth = await googleService.initializeGoogleAuth();

        if (auth) {
            // If auth successful, initialize services
            console.log('Google Auth initialized successfully');
            etlService.setAuth(auth);
            syncQueue.setInitialized(true);
            console.log('Services fully initialized with auth');

            // Start ETL after auth is confirmed
            await etlService.initialize();
            console.log('ETL Service initialization complete');
        } else {
            // If no auth, prepare services but don't start them
            console.log('No auth available, initializing services in standby mode...');

            // Initialize ETL in waiting mode
            const etlInitPromise = etlService.initialize();

            // Set up auth success listener
            googleService.on('authenticated', async (newAuth) => {
                console.log('Received authentication update');
                etlService.setAuth(newAuth);
                syncQueue.setInitialized(true);
                console.log('Services activated with new auth');
            });

            // Wait for ETL to be ready (but not started)
            await etlInitPromise;
            console.log('Services initialized in standby mode');
        }

        // Set up graceful shutdown
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

async function gracefulShutdown() {
    console.log('Shutdown signal received');
    syncQueue.stopMonitoring();
    if (etlService.authCheckInterval) {
        clearInterval(etlService.authCheckInterval);
    }
    process.exit(0);
}

startServer().catch(error => {
    console.error('Fatal error during ETL startup:', error);
    process.exit(1);
});