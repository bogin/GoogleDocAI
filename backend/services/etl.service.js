const { Op } = require('sequelize');
const { File } = require('../models');
const syncQueue = require('./queue.service');
const { google } = require('googleapis');

class ETLService {
    constructor(auth) {
        this.drive = google.drive({ version: 'v3', auth });
        this.lastSyncTime = null;
        this.maxRetries = 3;
        this.issyncing = false;
        this.syncQueue = syncQueue;

        // Initialize queue processor
        this.syncQueue.setTaskProcessor(this.processTask.bind(this));
    }

    async startPeriodicSync() {
        await this.checkForNewFiles();
        await this.syncFiles();
        // Check for new files every 5 minutes
        setInterval(() => {
            this.checkForNewFiles();
        }, 5 * 60 * 1000);

        // Process pending/failed files every 15 minutes
        setInterval(() => {
            this.syncFiles();
        }, 15 * 60 * 1000);
    }

    async checkForNewFiles() {
        try {
            let pageToken = null;
            const query = this.lastSyncTime
                ? `modifiedTime > '${this.lastSyncTime.toISOString()}'`
                : '';

            do {
                const response = await this.drive.files.list({
                    pageSize: 100, // Fetch in chunks of 100
                    pageToken,
                    q: query,
                    fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, owners, size)'
                });

                if (response.data.files.length > 0) {
                    // Add batch to queue
                    await this.syncQueue.addToQueue({
                        type: 'BULK_SYNC',
                        files: response.data.files
                    });
                }

                pageToken = response.data.nextPageToken;
            } while (pageToken);

            this.lastSyncTime = new Date();
        } catch (error) {
            console.error('Failed to check for new files:', error);
        }
    }

    async syncFiles(retryCount = 0) {
        if (this.issyncing) {
            console.log('Sync already in progress');
            return;
        }

        this.issyncing = true;
        try {
            // Get files that need syncing
            const filesToSync = await File.findAll({
                where: {
                    [Op.or]: [
                        { sync_status: 'pending' },
                        {
                            sync_status: 'error',
                            last_sync_attempt: {
                                [Op.lt]: new Date(Date.now() - 15 * 60 * 1000)
                            }
                        }
                    ]
                },
                limit: 100
            });

            if (filesToSync.length > 0) {
                // Add to queue as a batch
                await this.syncQueue.addToQueue({
                    type: 'RETRY_SYNC',
                    files: filesToSync
                });
            }
        } catch (error) {
            console.error('Sync process failed:', error);
            if (retryCount < this.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.syncFiles(retryCount + 1);
            }
        } finally {
            this.issyncing = false;
        }
    }

    async processTask(task) {
        const { type, files } = task;
        const results = { success: 0, failed: 0, errors: [] };

        // Process files in batches of 50
        const batchSize = 500;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);

            await Promise.all(batch.map(async (fileData) => {
                try {
                    if (type === 'RETRY_SYNC') {
                        await this.syncSingleFile(fileData);
                    } else {
                        await File.upsert({
                            id: fileData.id,
                            name: fileData.name,
                            mimeType: fileData.mimeType,
                            modifiedTime: new Date(fileData.modifiedTime),
                            owner: fileData.owners?.[0]?.name,
                            size: fileData.size,
                            metadata: fileData,
                            sync_status: 'success'
                        });
                    }
                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        fileId: fileData.id,
                        error: error.message
                    });

                    await File.upsert({
                        id: fileData.id,
                        sync_status: 'error',
                        error_log: {
                            error: error.message,
                            timestamp: new Date()
                        }
                    });
                }
            }));
        }

        return results;
    }

    async syncSingleFile(file) {
        try {
            await file.update({
                sync_status: 'in_progress',
                last_sync_attempt: new Date()
            });

            const response = await this.drive.files.get({
                fileId: file.id,
                fields: '*'
            });

            await file.update({
                name: response.data.name,
                mimeType: response.data.mimeType,
                modifiedTime: new Date(response.data.modifiedTime),
                owner: response.data.owners?.[0]?.name,
                size: response.data.size,
                metadata: response.data,
                sync_status: 'success',
                error_log: null
            });
        } catch (error) {
            throw new Error(`Failed to sync file ${file.id}: ${error.message}`);
        }
    }

    async handleSyncError(file, error) {
        const errorLog = {
            message: error.message,
            timestamp: new Date(),
            details: error.stack
        };

        await file.update({
            sync_status: 'error',
            error_log: errorLog
        });

        console.error(`Sync error for file ${file.id}:`, errorLog);
    }
}

module.exports = ETLService;