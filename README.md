# Unframe Home Assignment

A full-stack application that integrates Google Drive with AI capabilities, providing intelligent file management, content search, and analytics features.

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/download/)
- [MongoDB](https://www.mongodb.com/try/download/community)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/bogin/Unframe.git
cd Unframe
```

2. Install dependencies:

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

3. Configure environment variables:

Create `.env` file in the backend directory:
```env
PORT=3000

DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=unframe_dev
DB_PORT=5432
DB_HOST=localhost

MONGO_URI=mongodb://localhost:27017/files
```

4. Setup the databases:
```bash
# Setup PostgreSQL
cd backend
npm run setup:db
npm run db:migrate

# Setup MongoDB (if needed)
npm run db:reset:mongo

# Reset both databases
npm run db:reset:all
```

5. Run the application:

```bash
# Backend (runs both main server and ETL process)
cd backend
npm run dev:all

# Frontend
cd frontend
npm run serve
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend: http://localhost:3000

# **Important First Steps**

Before using the application, you must:

1. **Configure System Settings:**
   - Navigate to the Settings page
   - Configure Google Drive API credentials:
     - Client ID
     - Client Secret
   - Configure OpenAI API keys for:
     - Analytics queries
     - Grammar processing
     - File content search
     - MongoDB queries
   Without these configurations, core features will not function.
   ** The system will work with minimum 1 key **

2. **Authorize Google Drive:**
   - Use the "Connect Drive" button in the navigation bar
   - Complete the OAuth2 authorization flow
   - Grant necessary permissions for file access

## Application Overview

### Core Features

1. **Files Management Module**
   - Comprehensive Google Drive integration
   - Advanced file operations and metadata management
   - Intelligent search system with dual-database architecture
   - Real-time synchronization features:
     * Background sync with configurable intervals
     * Intelligent retry mechanisms
     * Error tracking and recovery
     * Sync status monitoring
   - Advanced table features:
     * Dynamic column visibility
     * Custom column configurations
     * Multi-parameter filtering
     * Server-side pagination
   - File operations:
     * View and edit metadata
     * Update sharing settings
     * Copy file links
     * Delete files
     * Track modifications

2. **Analytics Module**
   - Natural language query processing
   - Dual search capabilities:
     * Metadata search in PostgreSQL
     * Content search in MongoDB
   - AI-powered insights generation
   - Real-time result processing
   - Advanced filtering and result management
   - Custom query capabilities

3. **System Settings**
   - Comprehensive API configuration:
     * Google Drive credentials
     * Multiple OpenAI API keys
     * System performance settings
   - Authentication management
   - System monitoring and logging
   - Secure credential storage

### Technical Implementation

#### Backend Architecture
- Node.js with Express
- Dual database architecture:
  * PostgreSQL for metadata (with Sequelize ORM)
  * MongoDB for file content
- In-memory cache
- Event-driven ETL pipeline
- Multiple OpenAI integrations
- Google Drive API integration

#### Frontend Architecture
- Vue.js 3 with TypeScript
- Vuex for state management
- Component-based UI architecture:
  * Reusable UI components
  * Dynamic form generation
  * Advanced table system
  * Custom filters
- Real-time data synchronization
- Responsive design

## Implementation Details

### 1. Google Drive Integration
- ✅ OAuth2 authentication flow
- ✅ Comprehensive file metadata retrieval
- ✅ Efficient pagination implementation
- ✅ Real-time sync mechanism
- ✅ Error handling and retry logic
- ✅ File content extraction

### 2. Data Management
- ✅ Dual database architecture
- ✅ Comprehensive data validation
- ✅ Multi-level caching system
- ✅ Permission tracking
- ✅ Sync status monitoring
- ✅ Content-based search

### 3. ETL Pipeline
- ✅ Intelligent batch processing
- ✅ Incremental updates
- ✅ Change detection
- ✅ Error recovery mechanism
- ✅ Performance optimization
- ✅ Background job management

### 4. Analytics Features
- ✅ Multiple OpenAI integrations
- ✅ Natural language processing
- ✅ Dual-database query generation
- ✅ Result merging and ranking
- ✅ Multi-level query caching
- ✅ Grammar correction

### 5. Frontend Implementation
- ✅ Dynamic component system
- ✅ Advanced table features
- ✅ Real-time updates
- ✅ Comprehensive error handling
- ✅ Loading states
- ✅ Toast notifications

### 6. Security Measures
- ✅ Input sanitization
- ✅ XSS protection
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Secure headers
- ✅ API key management

### 7. Performance Optimizations
- ✅ Multi-level caching
- ✅ Query optimization
- ✅ Batch processing
- ✅ Lazy loading
- ✅ Connection pooling
- ✅ Incremental updates

### 8. Quality
- ✅ Error handling
- ✅ Input validation
- ✅ Type checking
- ✅ Code documentation
- ✅ Clean architecture
- ✅ Component isolation

## License

ISC License - Created by Shachar Bogin