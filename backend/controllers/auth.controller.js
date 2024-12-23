const authService = require('../services/auth.service');

class AuthController {
    async initiateGoogleAuth(req, res) {
        try {
            const authUrl = await authService.getGoogleAuthUrl();
            res.redirect(authUrl);
        } catch (error) {
            console.error('Google auth initiation error:', error);
            res.status(500).json({
                error: 'Authentication service unavailable'
            });
        }
    }

    async handleGoogleCallback(req, res) {
        try {
            const { code } = req.query;
            const authResult = await authService.handleGoogleCallback(code);

            if (!authResult.success) {
                throw new Error('Authentication failed');
            }

            res.send('Authentication successful! You can close this window.');
        } catch (error) {
            console.error('Auth callback error:', error);
            res.status(500).json({
                error: 'Authentication failed'
            });
        }
    }
}

module.exports = new AuthController();