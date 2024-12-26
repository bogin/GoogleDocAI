const googleService = require('./google.service');
const etlService = require('./etl.service');
const smartQueue = require('../services/queue');

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
            console.error('Error getting Google auth URL:');
            throw new Error(error.message || 'Failed to generate authentication URL');
        }
    }

    async handleGoogleCallback(code) {
        try {
            await this.googleService.setCredentials(code);
            const auth = this.googleService.getAuth();

            if (!auth) {
                throw new Error('Failed to obtain authentication');
            }

            await this.etlService.setAuth(auth);
            await this.smartQueue.setInitialized(true);

            console.log('AuthService: Successfully authenticated and initialized services');

            return {
                success: true,
                message: 'Authentication and initialization successful'
            };
        } catch (error) {
            console.error('Error handling Google callback:');
            return {
                success: false,
                error: error.message || 'Authentication process failed'
            };
        }
    }

    async validateAuthToken(token) {
        try {
            await this.googleService.waitForInit();

            const isValid = token && this.googleService.isAuthenticated;

            return {
                success: true,
                valid: isValid
            };
        } catch (error) {
            console.error('Token validation error:');
            return {
                success: false,
                error: error.message || 'Token validation failed'
            };
        }
    }

    async revokeAccess() {
        try {
            await this.googleService.waitForInit();

            this.googleService.isAuthenticated = false;

            try {
                await fs.unlink(this.googleService.tokensPath);
            } catch (err) {
                // Ignore if file doesn't exist
            }

            await this.etlService.setAuth(null);
            this.smartQueue.setInitialized(false);

            return {
                success: true,
                message: 'Access successfully revoked'
            };
        } catch (error) {
            console.error('Access revocation error:');
            return {
                success: false,
                error: error.message || 'Failed to revoke access'
            };
        }
    }
}

module.exports = new AuthService();