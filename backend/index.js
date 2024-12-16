const { google } = require('googleapis');
const express = require('express');
const app = express();

// OAuth2 credentials from your JSON
const oauth2Client = new google.auth.OAuth2(
  "939872405402-1me7uv98gtnmge9tsuqleth134c81m30.apps.googleusercontent.com",
  "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",
  "http://localhost:3000/auth/google/callback"
);

// Generate authentication URL
const scopes = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes
});

// Setup Express routes
app.get('/', (req, res) => {
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // After getting tokens, fetch the document
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const response = await drive.files.list({
      pageSize: 100,
      q: "mimeType='application/vnd.google-apps.document'",
      fields: 'files(name)'
    });

    if (response.data.files.length) {
      res.send(`Found document: ${JSON.stringify(response.data.files, null, 4)}`);
    } else {
      res.send('No documents found.');
    }
  } catch (error) {
    res.send('Error: ' + error.message);
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
  console.log('Click the link above to start authentication');
});