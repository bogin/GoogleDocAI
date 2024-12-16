const { google } = require('googleapis');

class GoogleService {
  constructor() {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async initializeGoogleAuth() {
    // Initialize auth logic here
    // You'll need to implement OAuth flow
    console.log('Google Auth initialized');
  }

  async listFiles({ pageSize = 10, pageToken = null, query = null, modifiedAfter = null }) {
    try {
      let queryString = '';
      
      if (modifiedAfter) {
        queryString += `modifiedTime > '${new Date(modifiedAfter).toISOString()}'`;
      }

      if (query) {
        queryString += queryString ? ` and ${query}` : query;
      }

      const params = {
        pageSize,
        pageToken,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, owners, size)',
        orderBy: 'modifiedTime desc',
        q: queryString || undefined
      };

      const response = await this.drive.files.list(params);
      return response.data;
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
