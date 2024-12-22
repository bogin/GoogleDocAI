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

            if (!code || typeof code !== 'string') {
                return res.status(400).json({
                    error: 'Invalid authentication code'
                });
            }

            const authResult = await authService.handleGoogleCallback(code);

            if (authResult.success) {
                res.send('Authentication successful! You can close this window.');
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            console.error('Auth callback error:', error);
            res.status(500).json({
                error: 'Authentication failed'
            });
        }
    }
}

module.exports = new AuthController();