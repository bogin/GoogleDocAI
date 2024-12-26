# Unframe Home Assignment

A full-stack application that integrates Google Drive with AI capabilities, providing file management and intelligent analytics features.

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Redis](https://redis.io/download)
- [ReditDocker](https://hub.docker.com/_/redis) - I used this.
- [Git](https://git-scm.com/downloads)

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

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

MONGO_URI=mongodb://localhost:27017/files
```

4. Setup the database:
```bash
# Windows
cd backend
npm run setup:db
npm run db:migrate

# macOS/Linux
cd backend
sudo -u postgres npm run setup:db
npm run db:migrate
```

5. Run the application:

```bash
# Backend
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

Before running the application, you must:

 1. **Configure System Settings:**

    Navigate to the Settings page after starting the application
    Add Google Drive API credentials (Client ID and Secret)
    Configure OpenAI API key for analytics features
    Without these configurations, core features will not function


 2. **Authorize Google Drive:**

    Use the "Connect Drive" button in the navigation bar
    Complete the OAuth2 authorization flow
    Grant necessary permissions for file access


## Application Overview

### Core Features

1. **Files Management Module**
   - View and manage Google Drive files
   - CRUD operations on files
   - Advanced filtering and pagination
   - Real-time sync with Google Drive
   - Efficient file metadata handling
**Files Management Module**
    - View and manage Google Drive files through an intuitive interface 
    - Full CRUD operations for file metadata management
    - SQL-powered search capabilities with natural language processing
    - Advanced table features:
    * Server-side pagination
    * Dynamic column sorting
    * Multi-parameter filtering 
    * Real-time data updates
    - Intelligent search system:
    * Natural language queries converted to SQL
    * Complex search combinations (e.g., "show all PDF files modified last week")
    * Results highlighting and formatting
    * Search within results capability
    - Automated background synchronization:
    * Real-time sync with Google Drive
    * Incremental updates for changed files
    * Sync status tracking and error handling
    * Background job management
    - Efficient metadata management:
    * Structured file metadata storage
    * Owner and permission tracking
    * Version control
    * Change history
    * Custom metadata support
2. **Analytics Module**
   - Natural language querying of file data
   - AI-powered insights about files
   - Statistical analysis of file ownership
   - Usage patterns visualization
   - Custom query capabilities

3. **System Settings**
   - Google Drive API configuration
   - OpenAI API integration
   - Authentication management
   - System performance monitoring

### Technical Implementation

#### Backend Architecture
- Node.js with Express
- PostgreSQL database with Sequelize ORM
- Redis for caching
- Event-driven ETL pipeline
- OpenAI integration for analytics
- Google Drive API integration

#### Frontend Architecture
- Vue.js 3 with TypeScript
- Vuex for state management
- Component-based UI architecture
- Real-time data synchronization
- Responsive design

## Implementation Details

### 1. Google Drive Integration
- ✅ OAuth2 authentication flow
- ✅ Comprehensive file metadata retrieval
- ✅ Efficient pagination implementation
- ✅ Real-time sync mechanism
- ✅ Error handling and retry logic

### 2. Data Management
- ✅ PostgreSQL database schema
- ✅ File metadata storage
- ✅ User permissions tracking
- ✅ Sync status monitoring
- ✅ Data validation and sanitization

### 3. ETL Pipeline
- ✅ Batch processing system
- ✅ Change detection
- ✅ Incremental updates
- ✅ Error recovery
- ✅ Performance optimization

### 4. Analytics Features
- ✅ OpenAI API integration
- ✅ Natural language processing
- ✅ SQL query generation
- ✅ Statistical analysis
- ✅ Query caching

### 5. Frontend Implementation
- ✅ Responsive UI design
- ✅ Real-time updates
- ✅ Error handling
- ✅ Loading states
- ✅ User feedback

### 6. Security Measures
- ✅ Input sanitization
- ✅ XSS protection
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Secure headers

### 7. Performance Optimizations
- ✅ Redis caching
- ✅ Query optimization
- ✅ Batch processing
- ✅ Lazy loading
- ✅ Connection pooling

### 8. Testing & Quality
- ✅ Error handling
- ✅ Input validation
- ✅ Type checking
- ✅ Code documentation
- ✅ Clean architecture

## Future Improvements

1. Add comprehensive test coverage
2. Implement file content search
3. Add batch operations support
4. Enhance analytics capabilities
5. Add user management system

## License

ISC License - Created by Shachar Bogin