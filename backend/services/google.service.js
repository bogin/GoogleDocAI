const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

class GoogleService {
    constructor() {
        this.auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        this.tokensPath = path.join(__dirname, '../tokens.json');
        this.loadSavedTokens();
    }

    async loadSavedTokens() {
        try {
            const tokens = await fs.readFile(this.tokensPath);
            this.auth.setCredentials(JSON.parse(tokens));
        } catch (error) {
            console.log('No saved tokens found');
        }
    }

    async setCredentials(code) {
        const { tokens } = await this.auth.getToken(code);
        this.auth.setCredentials(tokens);
        await fs.writeFile(this.tokensPath, JSON.stringify(tokens));
        return tokens;
    }

    getAuth() {
        return this.auth;
    }

    getAuthUrl() {
        return this.auth.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.metadata.readonly']
        });
    }

    async initializeGoogleAuth() {
        try {
            await this.loadSavedTokens();

            // Verify auth is working
            if (this.auth.credentials) {
                // Test the credentials with a simple API call
                try {
                    await this.drive.files.list({ pageSize: 1 });
                    console.log('Google Auth initialized successfully');
                    return this.auth;
                } catch (error) {
                    console.log('Stored credentials are invalid, needs re-authentication');
                    // Clear invalid tokens
                    await fs.unlink(this.tokensPath).catch(() => { });
                }
            } else {
                console.log('No credentials found, authentication required');
            }
        } catch (error) {
            console.error('Error initializing Google Auth:', error);
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
