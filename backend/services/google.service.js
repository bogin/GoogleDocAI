const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
const systemSettingsService = require('./system-settings.service');
const BaseService = require('./base.service');

class GoogleService extends BaseService {
    constructor() {
        super();
        this.auth = null;
        this.drive = null;
        this.isAuthenticated = false;
        this.tokensPath = path.join(__dirname, '../tokens.json');
        this.configurationPromise = null;
        this.configResolver = null;
    }

    async waitForConfiguration() {
        const isInitialized = await this.initialize();
        if (isInitialized) return true;

        if (!this.configurationPromise) {
            this.configurationPromise = new Promise(resolve => {
                this.configResolver = resolve;

                const checkInterval = setInterval(async () => {
                    const initialized = await this.initialize();
                    if (initialized) {
                        clearInterval(checkInterval);
                        resolve(true);
                    }
                }, 2000);
            });
        }

        return this.configurationPromise;
    }


    async initialize() {
        try {
            const settings = await systemSettingsService.get('google');
            if (!settings?.value) {
                console.log('Waiting for Google settings...');
                return false;
            }

            const { clientId, clientSecret, redirectUri } = settings.value;
            this.auth = new google.auth.OAuth2(
                clientId,
                clientSecret,
                redirectUri || "http://localhost:3000/auth/google/callback"
            );

            this.drive = google.drive({ version: 'v3', auth: this.auth });

            this.auth.on('tokens', async (tokens) => {
                if (tokens.refresh_token || tokens.access_token) {
                    const currentTokens = await this.loadTokensFromFile();
                    const mergedTokens = {
                        ...currentTokens,
                        ...tokens,
                        access_token: tokens.access_token || currentTokens?.access_token,
                        refresh_token: tokens.refresh_token || currentTokens?.refresh_token,
                        expiry_date: tokens.expiry_date || currentTokens?.expiry_date
                    };
                    await this.saveTokens(mergedTokens);
                }
                this.emit('tokensUpdated', tokens);
            });

            await this.verifyAndInitializeAuth();

            this.markInitialized();
            return true;
        } catch (error) {
            console.error('Failed to initialize Google service:', error);
            return false;
        }
    }

    async verifyAndInitializeAuth() {
        try {
            const loaded = await this.loadSavedTokens();

            if (loaded && this.auth.credentials) {
                try {
                    await this.drive.files.list({ pageSize: 1 });
                    console.log('Google Auth initialized successfully');
                    this.isAuthenticated = true;
                    this.emit('authenticated', this.auth);
                    return true;
                } catch (apiError) {
                    console.log('Stored credentials are invalid:', apiError.message);
                    await fs.unlink(this.tokensPath).catch(() => { });
                    this.isAuthenticated = false;
                    this.emit('authenticationFailed', apiError);
                    this.emit('authenticationRequired');
                    return false;
                }
            }

            console.log('No valid credentials found, authentication required');
            this.emit('authenticationRequired');
            return false;
        } catch (error) {
            console.error('Error verifying authentication:', error);
            this.emit('authenticationFailed', error);
            return false;
        }
    }

    async loadTokensFromFile() {
        try {
            const tokensData = await fs.readFile(this.tokensPath, 'utf8');
            return JSON.parse(tokensData);
        } catch (error) {
            return null;
        }
    }

    async loadSavedTokens() {
        try {
            const tokens = await this.loadTokensFromFile();
            if (!tokens) {
                console.log('No saved tokens found');
                this.isAuthenticated = false;
                return false;
            }

            const expiryDate = new Date(tokens.expiry_date);
            const now = new Date();

            if (now >= expiryDate && tokens.refresh_token) {
                try {
                    const refreshedTokens = await this.auth.refreshToken(tokens.refresh_token);
                    const mergedTokens = {
                        ...tokens,
                        ...refreshedTokens.tokens,
                        refresh_token: tokens.refresh_token
                    };
                    await this.saveTokens(mergedTokens);
                    this.auth.setCredentials(mergedTokens);
                    this.isAuthenticated = true;
                    this.emit('authenticated', this.auth);
                    return true;
                } catch (refreshError) {
                    console.log('Failed to refresh tokens:', refreshError);
                    this.isAuthenticated = false;
                    return false;
                }
            } else {
                this.auth.setCredentials(tokens);
                this.isAuthenticated = true;
                this.emit('authenticated', this.auth);
                return true;
            }
        } catch (error) {
            console.log('Error loading tokens:', error);
            this.isAuthenticated = false;
            return false;
        }
    }

    async setCredentials(code) {
        try {
            await this.waitForInit();
            const { tokens } = await this.auth.getToken(code);

            const existingTokens = await this.loadTokensFromFile();
            const mergedTokens = {
                ...existingTokens,
                ...tokens,
                refresh_token: tokens.refresh_token || existingTokens?.refresh_token
            };

            this.auth.setCredentials(mergedTokens);
            await this.saveTokens(mergedTokens);
            this.isAuthenticated = true;
            this.emit('authenticated', this.auth);
            return mergedTokens;
        } catch (error) {
            console.error('Error setting credentials:', error);
            this.isAuthenticated = false;
            throw error;
        }
    }

    async saveTokens(tokens) {
        try {
            await fs.writeFile(this.tokensPath, JSON.stringify(tokens, null, 2));
            console.log('Tokens saved successfully');
        } catch (error) {
            console.error('Error saving tokens:', error);
            throw error;
        }
    }

    getAuthUrl() {
        if (!this.auth) {
            throw new Error('Google service not configured yet - waiting for settings');
        }

        return this.auth.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.metadata.readonly'
            ]
        });
    }

    async requiresSetup() {
        await this.waitForInit();
        if (!this.isAuthenticated) return 'authentication';
        return null;
    }

    getAuth() {
        return this.auth;
    }

    async listFiles({ pageSize, nextPageToken = null, query = null, filters = null }) {
        await this.waitForInit();
        try {
            let queryString = '';

            if (filters?.modifiedAfter) {
                queryString += `modifiedTime > '${new Date(filters.modifiedAfter).toISOString()}'`;
            }

            if (query) {
                queryString += queryString ? ` and ${query}` : query;
            }

            const params = {
                pageSize,
                pageToken: nextPageToken,
                fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, owners, size)',
                orderBy: 'modifiedTime desc',
                q: queryString || undefined
            };

            const response = await this.drive.files.list(params);
            return {
                files: response.data.files,
                nextPageToken: response.data.nextPageToken,
                hasMore: !!response.data.nextPageToken,
            };
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    }

    async getFile(fileId) {
        await this.waitForInit();
        try {
            const response = await this.drive.files.get({ fileId });
            return response.data;
        } catch (error) {
            console.error('Error getting file:', error);
            throw error;
        }
    }
}

const googleService = new GoogleService();
module.exports = googleService;