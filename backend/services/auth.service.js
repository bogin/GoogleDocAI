// services/auth.service.js
const googleService = require('./google.service');
const etlService = require('./etl.service');
const smartQueue = require('../queue/smart.queue');

class AuthService {
    constructor() {
        this.googleService = googleService;
        this.etlService = etlService;
        this.smartQueue = smartQueue;
    }

    async getGoogleAuthUrl() {
        try {
            // Wait for service to be ready
            await this.googleService.waitForInit();
            return this.googleService.getAuthUrl();
        } catch (error) {
            console.error('Error getting Google auth URL:', error);
            throw new Error(error.message || 'Failed to generate authentication URL');
        }
    }

    async handleGoogleCallback(code) {
        try {
            // Set credentials and get auth
            await this.googleService.setCredentials(code);
            const auth = this.googleService.getAuth();

            if (!auth) {
                throw new Error('Failed to obtain authentication');
            }

            // Initialize dependent services
            await this.etlService.setAuth(auth);
            await this.smartQueue.setInitialized(true);

            console.log('Successfully authenticated and initialized services');

            return {
                success: true,
                message: 'Authentication and initialization successful'
            };
        } catch (error) {
            console.error('Error handling Google callback:', error);
            return {
                success: false,
                error: error.message || 'Authentication process failed'
            };
        }
    }

    async validateAuthToken(token) {
        try {
            // Wait for service to be ready
            await this.googleService.waitForInit();

            // Implement token validation logic here
            const isValid = token && this.googleService.isAuthenticated;

            return {
                success: true,
                valid: isValid
            };
        } catch (error) {
            console.error('Token validation error:', error);
            return {
                success: false,
                error: error.message || 'Token validation failed'
            };
        }
    }

    async revokeAccess() {
        try {
            await this.googleService.waitForInit();

            // Reset authentication state
            this.googleService.isAuthenticated = false;

            // Clear tokens file if it exists
            try {
                await fs.unlink(this.googleService.tokensPath);
            } catch (err) {
                // Ignore if file doesn't exist
            }

            // Notify services
            this.etlService.setAuth(null);
            this.smartQueue.setInitialized(false);

            return {
                success: true,
                message: 'Access successfully revoked'
            };
        } catch (error) {
            console.error('Access revocation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to revoke access'
            };
        }
    }
}

module.exports = new AuthService();