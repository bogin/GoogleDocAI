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
            return this.googleService.getAuthUrl();
        } catch (error) {
            console.error('Error getting Google auth URL:', error);
            throw new Error('Failed to generate authentication URL');
        }
    }

    async handleGoogleCallback(code) {
        try {
            await this.googleService.setCredentials(code);
            const auth = this.googleService.getAuth();

            if (!auth) {
                throw new Error('Failed to obtain authentication');
            }

            // Initialize dependent services
            this.etlService.setAuth(auth);
            this.smartQueue.setInitialized(true);

            console.log('Successfully authenticated and initialized services');

            return {
                success: true,
                message: 'Authentication and initialization successful'
            };
        } catch (error) {
            console.error('Error handling Google callback:', error);
            return {
                success: false,
                error: 'Authentication process failed'
            };
        }
    }

    // Additional authentication-related methods can be added here
    async validateAuthToken(token) {
        try {
            // Implement token validation logic
            return {
                success: true,
                valid: true // or false based on validation
            };
        } catch (error) {
            console.error('Token validation error:', error);
            return {
                success: false,
                error: 'Token validation failed'
            };
        }
    }

    async revokeAccess(userId) {
        try {
            // Implement access revocation logic
            await this.googleService.revokeAccess(userId);
            return {
                success: true,
                message: 'Access successfully revoked'
            };
        } catch (error) {
            console.error('Access revocation error:', error);
            return {
                success: false,
                error: 'Failed to revoke access'
            };
        }
    }
}

module.exports = new AuthService();