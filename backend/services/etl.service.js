const { google } = require('googleapis');
const { Op } = require('sequelize');
const syncQueue = require('../services/queue');
const googleService = require('./google.service');
const BaseService = require('./base.service');
const filesRepository = require('../repo/files.repository');
const systemSettingsRepository = require('../repo/systemSettings.repository');

class ETLService extends BaseService {
    constructor() {
        super();
        this.addDependency(googleService);
        this.drive = null;
        this.isSyncing = false;
    }

    async initialize() {
        await this.waitForDependencies();
        await this.loadLastSyncTime();
        this.markInitialized();
    }

    setAuth(auth) {
        if (!auth) return;
        this.drive = google.drive({ version: 'v3', auth });
        this.startPeriodicSync().catch(console.error);
    }

    async loadLastSyncTime() {
        try {
            const setting = await systemSettingsRepository.findOne({
                where: { key: 'lastSyncTime' }
            });

            this.lastSyncTime = setting?.value?.time ? new Date(setting.value.time) : null;
        } catch (error) {
            console.error('Error loading last sync time:');
            this.lastSyncTime = null;
        }
    }

    async updateLastSyncTime() {
        const now = new Date();
        await systemSettingsRepository.upsert({
            key: 'lastSyncTime',
            value: { time: now.toISOString() }
        });
        this.lastSyncTime = now;
    }

    async determineFilesToSync() {
        const TWO_HOURS = 2 * 60 * 60 * 1000;
        const ONE_DAY = 24 * 60 * 60 * 1000;

        const filesToSync = await filesRepository.findAll({
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
        if (!this.isInitialized) return;

        try {
            let pageToken = null;
            const query = this.lastSyncTime
                ? `modifiedTime > '${this.lastSyncTime.toISOString()}' and mimeType = 'application/vnd.google-apps.document'`
                : "mimeType = 'application/vnd.google-apps.document'";

            do {
                const response = await this.drive.files.list({
                    pageSize: 100,
                    pageToken,
                    q: query,
                    fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, owners, size, webViewLink, iconLink, shared, lastModifyingUser, permissions, version, capabilities, trashed)'
                });


                if (response.data.files.length > 0) {
                    await syncQueue.addToQueue({
                        type: 'BULK_SYNC',
                        files: response.data.files
                    });
                }

                pageToken = response.data.nextPageToken;
            } while (pageToken);

            await this.updateLastSyncTime();
        } catch (error) {
            console.error('Failed to check for new files:');
        }
    }

    async checkForModifiedFiles() {
        const latestSuccessfulSync = await filesRepository.findOne({
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

    async startPeriodicSync() {
        await this.loadLastSyncTime();

        const modifiedFiles = await this.checkForModifiedFiles();
        if (modifiedFiles?.data?.files?.length > 0) {
            await filesRepository.bulkUpdate({
                update: { sync_status: 'stale' },
                where: {
                    id: { [Op.in]: modifiedFiles.data.files.map(f => f.id) }
                }
            });
        }

        await this.checkForNewFiles();
        await this.syncFiles();

        setInterval(async () => {
            if (this.isInitialized) {
                await this.checkForNewFiles();
                await this.syncFiles();
            }
        }, 60 * 1000);
    }

    async syncFiles(retryCount = 0) {
        if (this.isSyncing) {
            return;
        }

        this.isSyncing = true;
        try {
            const filesToSync = await filesRepository.findAll({
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
                await syncQueue.addToQueue({
                    type: 'RETRY_SYNC',
                    files: filesToSync
                });
            }
        } catch (error) {
            console.error('Sync process failed:');
            if (retryCount < this.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.syncFiles(retryCount + 1);
            }
        } finally {
            this.isSyncing = false;
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

            const updatedData = {
                name: response.data.name,
                mimeType: response.data.mimeType,
                modifiedTime: new Date(response.data.modifiedTime),
                owner: response.data.owners?.[0]?.name,
                size: response.data.size,
                metadata: response.data,
                sync_status: 'success',
                error_log: null
            };

            await file.update(updatedData);
        } catch (error) {
            await this.handleSyncError(file, error);
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

module.exports = new ETLService();