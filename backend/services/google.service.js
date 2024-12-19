const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');

class GoogleService extends EventEmitter {
    constructor() {
        super();
        this.auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        this.tokensPath = path.join(__dirname, '../tokens.json');
        this.isAuthenticated = false;

        // Set up token refresh handler
        this.auth.on('tokens', async (tokens) => {
            if (tokens.refresh_token) {
                const mergedTokens = { ...this.auth.credentials, ...tokens };
                await this.saveTokens(mergedTokens);
            }
            this.emit('tokensUpdated', tokens);
        });
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

    async loadSavedTokens() {
        try {
            const tokensData = await fs.readFile(this.tokensPath, 'utf8');
            const tokens = JSON.parse(tokensData);

            // Check if tokens are expired
            const expiryDate = new Date(tokens.expiry_date);
            const now = new Date();

            if (now >= expiryDate) {
                // Tokens are expired, try to refresh
                try {
                    const refreshedTokens = await this.auth.refreshToken(tokens.refresh_token);
                    await this.saveTokens(refreshedTokens.tokens);
                    this.auth.setCredentials(refreshedTokens.tokens);
                    this.isAuthenticated = true;
                    return true;
                } catch (refreshError) {
                    console.log('Failed to refresh tokens:', refreshError);
                    this.isAuthenticated = false;
                    return false;
                }
            } else {
                // Tokens are still valid
                this.auth.setCredentials(tokens);
                this.isAuthenticated = true;
                return true;
            }
        } catch (error) {
            console.log('No saved tokens found or error reading tokens:', error);
            this.isAuthenticated = false;
            return false;
        }
    }


    async setCredentials(code) {
        try {
            const { tokens } = await this.auth.getToken(code);
            this.auth.setCredentials(tokens);
            await this.saveTokens(tokens);
            this.isAuthenticated = true;
            this.emit('authenticated', this.auth);
            return tokens;
        } catch (error) {
            console.error('Error setting credentials:', error);
            this.isAuthenticated = false;
            throw error;
        }
    }

    getAuth() {
        return this.auth;
    }

    getAuthUrl() {
        return this.auth.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent', // Force showing consent screen
            scope: [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.metadata.readonly'
            ]
        });
    }

    async initializeGoogleAuth() {
        try {
            const loaded = await this.loadSavedTokens();

            if (loaded && this.auth.credentials) {
                try {
                    // Verify the credentials with a simple API call
                    await this.drive.files.list({ pageSize: 1 });
                    console.log('Google Auth initialized successfully');
                    this.emit('authenticated', this.auth);
                    return this.auth;
                } catch (apiError) {
                    console.log('Stored credentials are invalid:', apiError.message);
                    // Clear invalid tokens
                    await fs.unlink(this.tokensPath).catch(() => { });
                    this.isAuthenticated = false;
                    this.emit('authenticationFailed', apiError);
                    return null;
                }
            }

            console.log('No valid credentials found, authentication required');
            this.emit('authenticationRequired');
            return null;
        } catch (error) {
            console.error('Error initializing Google Auth:', error);
            this.emit('authenticationFailed', error);
            throw error;
        }
    }

    async listFiles({ pageSize, nextPageToken = null, query = null, filters = null }) {
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
        try {
            const response = await this.drive.files.get({ fileId });
            return response.data;
        } catch (error) {
            console.error('Error getting file:', error);
            throw error;
        }
    }

    async deleteFile(fileId) {
        try {
            await this.drive.files.delete({ fileId });
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    async updateFile(fileId, metadata) {
        try {
            const response = await this.drive.files.update({
                fileId,
                requestBody: metadata
            });
            return response.data;
        } catch (error) {
            console.error('Error updating file:', error);
            throw error;
        }
    }
}

const googleService = new GoogleService();
module.exports = googleService;
