# Unframe Project

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Database Setup

### Option 1: Automatic Setup
1. Install PostgreSQL from https://www.postgresql.org/download/
2. During installation, note the password you set for 'postgres' user
3. Ensure PostgreSQL service is running
4. Run setup:
```
npm run setup:db
Option 2: Manual Setup
If automatic setup fails, follow these steps:

Connect to PostgreSQL as postgres user:

psql -U postgres

In PostgreSQL command line, run:

sqlCREATE USER unframe_user WITH PASSWORD 'unframe_password';
CREATE DATABASE unframe_dev;
GRANT ALL PRIVILEGES ON DATABASE unframe_dev TO unframe_user;
Project Setup

Clone the repository:

git clone [repository-url]
cd unframe

Install dependencies:

npm install

Create environment file:

cp .env.example .env

Update .env with your database credentials:

DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=unframe_dev
DB_HOST=localhost
DB_PORT=5432

Run database migrations:

npm run db:migrate
Available Scripts
npm run dev        # Start development server
npm run db:migrate # Run database migrations
npm run db:reset   # Reset database (drops all tables and re-runs migrations)
Troubleshooting
Database Connection Issues

Ensure PostgreSQL service is running
Verify credentials in .env match what you created
Test connection:

psql -U unframe_user -d unframe_dev -h localhost
Common Error Solutions

"role 'postgres' does not exist" - Ensure PostgreSQL is installed correctly
"password authentication failed" - Verify password in .env
"database already exists" - Safe to ignore during setup




Getting Started with Unframe Backend
After completing the database setup, follow these steps to initialize and run the application:
Authentication Setup

Set up a Google Cloud Project:

Go to Google Cloud Console
Create a new project or select existing one
Enable Google Drive API
Create OAuth 2.0 credentials
Configure OAuth consent screen


Copy your credentials to .env:

envCopyGOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
OpenAI Setup

Get your OpenAI API key:

Go to OpenAI Platform
Create an account or login
Navigate to API keys section
Create a new secret key


Add to .env:

envCopyOPENAI_API_KEY=your_openai_api_key
Start the Application

Install dependencies:

bashCopynpm install

Run database migrations:

bashCopynpm run db:migrate

Start the development server:

bashCopynpm run dev
Testing the Setup

Visit http://localhost:3000/auth/google to authenticate with Google Drive
Test the API endpoints:


GET /api/files - List files
GET /api/files/:id - Get single file
PATCH /api/files/:id - Update file
DELETE /api/files/:id - Delete file

Available Scripts
bashCopynpm run dev          # Start development server
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
Troubleshooting

If authentication fails, ensure your Google credentials and redirect URI are correct
For database issues, check your PostgreSQL connection settings
For API errors, check the server logs

Need help? Contact me at [your-contact]