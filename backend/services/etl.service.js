const { Op } = require('sequelize');
const { File } = require('../models');

export class ETLService {
    constructor(auth) {
        this.drive = google.drive({ version: 'v3', auth });
        this.lastSyncTime = null;
        this.maxRetries = 3;
        this.issyncing = false;
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
                                [Op.lt]: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
                            }
                        }
                    ]
                },
                limit: 100
            });

            for (const file of filesToSync) {
                try {
                    await this.syncSingleFile(file);
                } catch (error) {
                    await this.handleSyncError(file, error);
                }
            }
        } catch (error) {
            console.error('Sync process failed:', error);
            if (retryCount < this.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                return this.syncFiles(retryCount + 1);
            }
        } finally {
            this.issyncing = false;
        }
    }

    async syncSingleFile(file) {
        try {
            // Update sync status
            await file.update({ sync_status: 'in_progress', last_sync_attempt: new Date() });

            // Fetch file from Google Drive
            const response = await this.drive.files.get({
                fileId: file.id,
                fields: '*'
            });

            // Update file data
            await file.update({
                name: response.data.name,
                mimeType: response.data.mimeType,
                modifiedTime: new Date(response.data.modifiedTime),
                owner: response.data.owners?.[0]?.displayName,
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

        // Log to monitoring system
        console.error(`Sync error for file ${file.id}:`, errorLog);
    }

    // Modified processTask with error handling
    async processTask(task) {
        const { files } = task;
        const results = { success: 0, failed: 0, errors: [] };

        for (const fileData of files) {
            try {
                await File.upsert({
                    id: fileData.id,
                    name: fileData.name,
                    mimeType: fileData.mimeType,
                    modifiedTime: new Date(fileData.modifiedTime),
                    owner: fileData.owners?.[0]?.displayName,
                    size: fileData.size,
                    metadata: fileData,
                    sync_status: 'success'
                });
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
                    error_log: { error: error.message, timestamp: new Date() }
                });
            }
        }

        return results;
    }
}