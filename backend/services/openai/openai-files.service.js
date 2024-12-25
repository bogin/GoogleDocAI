const cacheService = require('./cache.service');
const grammarAgentService = require('./grammar-agent.service');
const BaseOpenAIService = require('./open-ai.abstract.service');

class FilesOpenAIService extends BaseOpenAIService {
  systemPrompt = `
 You are a SQL query generator for a database storing Google Drive-like files.
  Translate human-friendly text into Postgres terms aligned with the following schema definitions, rules, and examples.

  I will use your output query for this:
  const {sequelize} = require('../../models');
  const [results, metadata] = await sequelize.query(query);

  **Schemas:**
  - File: (tableName: 'files')
      - id: character varying(255) (primary key, NOT NULL)
      - name: text (NOT NULL)
      - mime_type: character varying(255) (nullable)
      - icon_link: character varying(255) (nullable)
      - web_view_link: character varying(255) (nullable)
      - size: character varying(255) (nullable)
      - shared: boolean (default: false, nullable)
      - trashed: boolean (default: false, nullable)
      - created_time: timestamp with time zone (nullable)
      - modified_time: timestamp with time zone (nullable)
      - version: character varying(255) (nullable)
      - last_modifying_user: jsonb (nullable)
      - permissions: jsonb (nullable)
      - capabilities: jsonb (nullable)
      - sync_status: character varying(255) (default: 'pending', nullable)
      - last_sync_attempt: timestamp with time zone (nullable)
      - error_log: jsonb (nullable)
      - metadata: jsonb (nullable)
      - created_at: timestamp with time zone (default: CURRENT_TIMESTAMP)
      - updated_at: timestamp with time zone (default: CURRENT_TIMESTAMP)
      - deleted_at: timestamp with time zone (nullable)
      Indexes:
      - files_mime_type (mime_type)
      - files_modified_time (modified_time)
      - files_sync_status (sync_status)
      - files_trashed (trashed)

  - User: (tableName: 'users')
      - id: integer (primary key, auto-increment)
      - permission_id: character varying(255) (unique, NOT NULL)
      - email: character varying(255) (unique, NOT NULL)
      - display_name: character varying(255) (nullable)
      - photo_link: character varying(255) (nullable)
      - total_files: integer (default: 0)
      - total_size: bigint (default: 0)
      - created_at: timestamp with time zone (NOT NULL)
      - updated_at: timestamp with time zone (NOT NULL)
      Indexes:
      - users_email (email)
      - users_permission_id (permission_id)

  - FileOwner: (tableName: 'file_owners')
      - id: integer (primary key, auto-increment, NOT NULL)
      - file_id: character varying(255) (foreign key to files.id, ON UPDATE CASCADE, ON DELETE CASCADE, NOT NULL)
      - user_id: integer (foreign key to users.id, ON UPDATE CASCADE, ON DELETE CASCADE, NOT NULL)
      - permission_role: character varying(255) (default: 'reader', NOT NULL)
      - created_at: timestamp with time zone (NOT NULL)
      - updated_at: timestamp with time zone (NOT NULL)
      Indexes:
      - file_owner_unique (unique index on file_id, user_id)
    
  **Rules:**
  1. JSONB Operation Rules:
    - Use ->> for text extraction (e.g., last_modifying_user->>'emailAddress')
    - Use -> for JSON object extraction (e.g., metadata->'owners'->0)
    - Cast JSONB literals with ::jsonb (e.g., '{"role": "reader"}'::jsonb)
    - Use @> for containment queries
    - Use jsonb_array_length() for array size checks
    - Use proper nesting for metadata.owners array access

  2. Table Relationship Rules:
    - Use proper table aliases (f for files, u for users, fo for file_owners)
    - Join with ON conditions matching foreign keys exactly
    - Use LEFT JOIN for optional relationships
    - Always include deleted_at IS NULL for active records

  3. Column Name Rules:
    - Use exact column names as defined in schema
    - Use snake_case for all column references
    - Include table aliases for all column references
    - Use proper JSONB path navigation for nested fields

  4. Data Type Rules:
    - Handle timestamps with time zone awareness
    - Use proper boolean values (true/false)
    - Cast string values in JSONB queries
    - Handle NULL values explicitly

  5. Security Rules:
    - Always include soft delete checks
    - Filter by user permissions when relevant
    - Check shared status for collaborative queries
    - Validate file access permissions

  6. Pagination and Sorting:
    - Accept offset and limit parameters
    - Default sort by modified_time DESC
    - Include proper index usage
    - Support custom sorting fields

  7. Performance Rules:
    - Use available indexes (mime_type, modified_time, sync_status, trashed)
    - try to use SELECT * statements to get all the data
    - Use specific JSONB field extraction
    - Optimize JOIN operations

  8. Error Handling:
    - Return clear error messages
    - Validate all input parameters
    - Check for required fields
    - Handle edge cases

  9. Query Structure:
    - Use consistent formatting
    - Include proper aliasing
    - Add relevant comments
    - Follow standard SQL style
  10. try to use SELECT * statements to get all the data
 
  *Example Queries:**
     
    1. "Find documents shared with me":
      SELECT DISTINCT f.*, 
            fo.permission_role,
            u.email as owner_email
      FROM public.files f
      JOIN public.file_owners fo ON f.id = fo.file_id
      JOIN public.users u ON fo.user_id = u.id
      WHERE f.shared = true
      AND f.deleted_at IS NULL
      AND f.capabilities->>'canEdit' = 'false'
      AND fo.user_id = :currentUserId
      ORDER BY f.modified_time DESC;

    2. "Search files by name and type":
      SELECT f.*
      FROM public.files f
      WHERE f.name ILIKE '%report%'
      AND f.mime_type = 'application/vnd.google-apps.document'
      AND f.deleted_at IS NULL
      ORDER BY f.modified_time DESC;

    3. "Get user's file statistics":
      SELECT u.email, 
            COUNT(DISTINCT f.id) as total_active_files,
            SUM(CASE WHEN f.trashed THEN 1 ELSE 0 END) as trashed_files,
            SUM(CASE WHEN f.shared THEN 1 ELSE 0 END) as shared_files
      FROM public.users u
      JOIN public.file_owners fo ON u.id = fo.user_id
      JOIN public.files f ON fo.file_id = f.id AND f.deleted_at IS NULL
      WHERE u.id = :userId
      GROUP BY u.id, u.email;

    4. "List files with specific owners":
      SELECT DISTINCT f.*, 
            array_agg(DISTINCT u.email) as owner_emails,
            array_agg(DISTINCT fo.permission_role) as permission_roles
      FROM public.files f
      JOIN public.file_owners fo ON f.id = fo.file_id
      JOIN public.users u ON fo.user_id = u.id
      WHERE u.email LIKE '%@tabnine.com'
      AND f.deleted_at IS NULL
      GROUP BY f.id
      ORDER BY f.modified_time DESC;

    5. "Find files with specific capabilities":
      SELECT f.*,
            array_agg(DISTINCT u.email) as owner_emails
      FROM public.files f
      JOIN public.file_owners fo ON f.id = fo.file_id
      JOIN public.users u ON fo.user_id = u.id
      WHERE f.capabilities->>'canDownload' = 'true'
      AND f.capabilities->>'canEdit' = 'false'
      AND f.deleted_at IS NULL
      GROUP BY f.id
      ORDER BY f.modified_time DESC;

    6. "Get recent file modifications":
      SELECT DISTINCT f.*,
            array_agg(DISTINCT u.email) as owner_emails,
            f.last_modifying_user->>'emailAddress' as last_modifier
      FROM public.files f
      JOIN public.file_owners fo ON f.id = fo.file_id
      JOIN public.users u ON fo.user_id = u.id
      WHERE f.modified_time >= NOW() - INTERVAL '24 hours'
      AND f.deleted_at IS NULL
      GROUP BY f.id
      ORDER BY f.modified_time DESC;

    7. "List shared files with specific owners":
      SELECT DISTINCT f.*,
            array_agg(DISTINCT fo.permission_role) as permission_roles
      FROM public.files f
      JOIN public.file_owners fo ON f.id = fo.file_id
      JOIN public.users u ON fo.user_id = u.id
      WHERE f.shared = true
      AND u.email = 'amirtu@tabnine.com'
      AND f.deleted_at IS NULL
      GROUP BY f.id
      ORDER BY f.modified_time DESC;

    8. "Get sync status report":
      SELECT f.*,
            array_agg(DISTINCT u.email) as owner_emails
      FROM public.files f
      JOIN public.file_owners fo ON f.id = fo.file_id
      JOIN public.users u ON fo.user_id = u.id
      WHERE f.sync_status = 'failed'
      AND f.deleted_at IS NULL
      GROUP BY f.id
      ORDER BY f.last_sync_attempt DESC;

    9. "List files by ownership and type":
      SELECT DISTINCT f.*,
            array_agg(DISTINCT u.email) as owner_emails,
            array_agg(DISTINCT fo.permission_role) as permission_roles
      FROM public.files f
      JOIN public.file_owners fo ON f.id = fo.file_id
      JOIN public.users u ON fo.user_id = u.id
      WHERE f.mime_type = 'application/vnd.google-apps.document'
      AND f.deleted_at IS NULL
      GROUP BY f.id
      ORDER BY f.modified_time DESC;
    `;
  constructor() {
    super();
  }

  async generateQuery({ query, page = 1, size = 10, queryConfig }) {
    await this.ensureInitialized();
    try {
      const cacheKey = `${query}-${page}-${size}`;
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const newQueryNoTypo = await grammarAgentService.processText(query);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.systemPrompt,
          },
          {
            role: 'user',
            content: `Generate a Postgres sql query string for: "${newQueryNoTypo}". Page: ${page}, PageSize: ${size}. queryConfig: ${JSON.stringify(queryConfig)}}`,
          },
        ],
      });

      const aiQueryConfig = response?.choices[0]?.message?.content
      if (aiQueryConfig?.includes("Error:") || !aiQueryConfig) {
        throw new Error("Error: Query is not searchable.");
      }

      const cleanedQuery = aiQueryConfig
        ?.replace(/```sql\n?/g, '')
        ?.replace(/```/g, '')
        ?.replace(/\n+/g, ' ')
        ?.replace(/\s+/g, ' ')
        ?.trim();

      if (!(typeof cleanedQuery === "String" && cleanedQuery.includes("Error:"))) {
        await cacheService.set(cacheKey, cleanedQuery);
      } else {
        throw new Error(cleanedQuery)
      }

      return cleanedQuery;
    } catch (error) {
      throw new Error(`AI query generation failed: ${error.message}`);
    }
  }
}

module.exports = new FilesOpenAIService();