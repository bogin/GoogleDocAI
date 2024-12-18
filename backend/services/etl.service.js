const { Op } = require('sequelize');
const { File } = require('../models');
const syncQueue = require('./queue.service');
const { google } = require('googleapis');
const { sequelize } = require('../models');
const { SystemSetting } = require('../models');

const SyncStatus = {
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error',
    STALE: 'stale',
    IN_PROGRESS: 'in_progress'
};

class ETLService {
    constructor(auth, options = {}) {
        this.drive = google.drive({ version: 'v3', auth });
        this.lastSyncTime = null;
        this.maxRetries = 3;
        this.issyncing = false;
        this.syncQueue = options.queue || syncQueue;
        this.syncQueue.setTaskProcessor(this.processTask.bind(this));
    }

    async loadLastSyncTime() {
        try {
            const setting = await SystemSetting.findOne({
                where: { key: 'lastSyncTime' }
            });
            
            if (setting?.value?.time) {
                this.lastSyncTime = new Date(setting.value.time);
            } else {
                this.lastSyncTime = null; // or handle the case when no sync time is found
            }
        } catch (error) {
            console.error('Error loading last sync time:', error);
            // Optionally handle the error (e.g., set a default value or log)
            this.lastSyncTime = null;
        }
    }
    
    async updateLastSyncTime() {
        const now = new Date();
        await SystemSetting.upsert({
            key: 'lastSyncTime',
            value: { time: now.toISOString() }
        });
        this.lastSyncTime = now;
    }

    async determineFilesToSync() {
        const TWO_HOURS = 2 * 60 * 60 * 1000;
        const ONE_DAY = 24 * 60 * 60 * 1000;

        const filesToSync = await File.findAll({
            where: {
                [Op.or]: [
                    {
                        sync_status: 'error',
                        last_sync_attempt: {
                            [Op.lt]: new Date(Date.now() - TWO_HOURS)
                        }
                    },
                    { sync_status: 'pending' },
                    {
                        sync_status: 'success',
                        updated_at: {
                            [Op.lt]: new Date(Date.now() - ONE_DAY)
                        }
                    }
                ]
            },
            order: [
                [sequelize.literal(`CASE 
                    WHEN sync_status = 'error' THEN 1
                    WHEN sync_status = 'pending' THEN 2
                    ELSE 3
                END`), 'ASC'],
                ['updated_at', 'ASC']
            ],
            limit: 100
        });

        return filesToSync;
    }

    async checkForNewFiles() {
        try {
            let pageToken = null;
            const query = this.lastSyncTime
                ? `modifiedTime > '${this.lastSyncTime.toISOString()}' and mimeType = 'application/vnd.google-apps.document'`
                : 'mimeType = \'application/vnd.google-apps.document\'';

            do {
                const response = await this.drive.files.list({
                    pageSize: 100,
                    pageToken,
                    q: query,
                    fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, owners, size, webViewLink, description, createdTime, iconLink, shared, sharingUser, lastModifyingUser, permissions, thumbnailLink, exportLinks, webContentLink, originalFilename, version, capabilities, trashed, capabilities(canEdit, canShare, canCopy))'
                });

                if (response.data.files.length > 0) {
                    await this.syncQueue.addToQueue({
                        type: 'BULK_SYNC',
                        files: response.data.files
                    });
                }

                pageToken = response.data.nextPageToken;
            } while (pageToken);

            await this.updateLastSyncTime();
        } catch (error) {
            console.error('Failed to check for new files:', error);
        }
    }

    async startPeriodicSync() {
        await this.loadLastSyncTime();

        // First, check for modified files and mark as stale if needed
        const modifiedFiles = await this.checkForModifiedFiles();
        if (modifiedFiles?.data?.files?.length > 0) {
            await File.update(
                { sync_status: 'stale' },
                {
                    where: {
                        id: { [Op.in]: modifiedFiles.data.files.map(f => f.id) }
                    }
                }
            );
        }

        // Then start your existing periodic sync
        await this.checkForNewFiles();
        await this.syncFiles();

        setInterval(async () => {
            await this.checkForNewFiles();
            await this.syncFiles();
        }, 5 * 60 * 1000);

    }

    async checkForModifiedFiles() {
        const latestSuccessfulSync = await File.findOne({
            where: { sync_status: 'success' },
            order: [['modified_time', 'DESC']],
            attributes: ['modified_time']
        });

        if (latestSuccessfulSync) {
            return this.drive.files.list({
                q: `modifiedTime > '${latestSuccessfulSync.dataValues?.modified_time?.toISOString()}' and mimeType = 'application/vnd.google-apps.document'`,
                fields: 'files(id, modifiedTime)'
            });
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

        try {
            const batchSize = 500;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);

                await Promise.all(batch.map(async (fileData) => {
                    try {
                        if (type === 'RETRY_SYNC') {
                            const fileModel = fileData instanceof File ?
                                fileData :
                                File.build(fileData);
                            await this.syncSingleFile(fileModel);
                        } else {
                            const res = await File.upsert({
                                id: fileData.id,
                                name: fileData.name,
                                mimeType: fileData.mimeType,
                                iconLink: fileData.iconLink,
                                webViewLink: fileData.webViewLink,
                                size: fileData.size,
                                shared: fileData.shared,
                                trashed: fileData.trashed,
                                createdTime: new Date(fileData.createdTime),
                                modifiedTime: new Date(fileData.modifiedTime),
                                version: fileData.version,
                                owner: fileData.owners?.[0],
                                lastModifyingUser: fileData.lastModifyingUser,
                                permissions: fileData.permissions,
                                capabilities: fileData.capabilities,
                                metadata: fileData, // Store complete raw response
                                syncStatus: SyncStatus.SUCCESS,
                                lastSyncAttempt: new Date()
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
                            metadata: fileData,
                            sync_status: SyncStatus.ERROR,
                            last_sync_attempt: new Date(),
                            error_log: {
                                error: error.message,
                                timestamp: new Date(),
                                details: error.stack
                            }
                        });
                    }
                }));
            }

            return results;

        } catch (error) {
            console.error('Task processing failed:', error);
            throw error;
        }
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