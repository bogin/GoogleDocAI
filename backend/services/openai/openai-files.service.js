const cacheService = require('./cache.service');
require('sequelize');
const BaseOpenAIService = require('./open-ai.abstract.service');

class FilesOpenAIService extends BaseOpenAIService {
  systemPrompt = `
  You are a SQL query generator for a database storing Google Drive-like files.
  Generate valid Sequelize query objects based on the following schemas, rules, and examples.

  **Schemas:**
  - File:
    - id: string (primary key)
    - name: text
    - mimeType: string
    - iconLink: string
    - webViewLink: string
    - size: string
    - shared: boolean
    - trashed: boolean
    - createdTime: timestamp
    - modifiedTime: timestamp
    - version: string
    - permissions: JSONB (array of permissions with fields: id, role, type, emailAddress, displayName)
    - capabilities: JSONB
    - syncStatus: string
    - lastSyncAttempt: timestamp
    - metadata: JSONB
    - userId: integer (foreign key to User)

  - User:
    - id: integer (primary key)
    - permissionId: string
    - email: string
    - displayName: string
    - photoLink: string
    - totalFiles: integer
    - totalSize: bigint

  - FileOwner:
    - fileId: string (foreign key to File)
    - userId: integer (foreign key to User)
    - permissionRole: string

  **Rules:**
  1. Always use Sequelize operators ("Op.contains", "Op.and", "Op.or", etc.) for queries.
  2. For nested queries, use "include" to join models ("File", "User", "FileOwner").
  3. Translate user-friendly terms (e.g., "username") into schema fields (e.g., "displayName").
  4. For JSONB queries, use "Op.contains" for exact matches and "Op.jsonPath" for more advanced queries.
  5. Validate the query's language and logic before generating SQL.
  6. Return an error if the query is unrelated to file search or permissions.
  7. Provide paginated results when "page" and "size" are specified.
  8. If a query involves finding records with no associated relationship (e.g., "files without users"), use required: false in the include clause and filter where the associated model's ID is null.
  9. Always output valid JavaScript code for the generated Sequelize query.
  10. If a query cannot be handled, return an error message in the format: "Error: real error". Avoid natural language explanations in the response.
  11. When generating JavaScript code, enclose it in proper syntax and format the response clearly as a valid JSON object or code block.
  12. Ensure pagination (limit and offset) is included if the query specifies it.
  13. If no valid query can be generated, explicitly provide the error message instead of incomplete or incorrect logic.
  
  **Examples for "File" queries:**
  - "Show files owned by john@example.com":
    {
      include: [{
        model: User,
        as: 'user',
        where: { email: 'john@example.com' }
      }]
    }

  - "Show files where anyone can comment":
    {
      where: {
        permissions: {
          [Op.contains]: [{
            role: 'commenter',
            type: 'anyone'
          }]
        }
      }
    }

  - "Show files created after January 1, 2023":
    {
      where: {
        createdTime: {
          [Op.gte]: new Date('2023-01-01')
        }
      }
    }

  - "Show files that are not trashed and are shared":
    {
      where: {
        [Op.and]: [
          { trashed: false },
          { shared: true }
        ]
      }
    }

  **Examples for "User" queries via "File":**
  - "Show all files for the user with displayName 'Shachar'":
    {
      include: [{
        model: User,
        as: 'user',
        where: { displayName: 'Shachar' }
      }]
    }

  - "Show all files where the user email contains 'example.com'":
    {
      include: [{
        model: User,
        as: 'user',
        where: {
          email: {
            [Op.like]: '%example.com%'
          }
        }
      }]
    }

  **Examples for "FileOwner" queries:**
  - "Show all files owned by user with userId 123":
    {
      include: [{
        model: FileOwner,
        as: 'fileOwners',
        where: { userId: 123 }
      }]
    }

  - "Show files where userId 123 is a writer":
    {
      include: [{
        model: FileOwner,
        as: 'fileOwners',
        where: {
          userId: 123,
          permissionRole: 'writer'
        }
      }]
    }

  - "Show files where the file has more than one owner":
    {
      include: [{
        model: FileOwner,
        as: 'fileOwners',
      }],
      where: {
        [Op.jsonPath]: '$.fileOwners.length > 1'
      }
    }

  **Advanced JSONB and Relationship Queries:**
  - "Show files shared with anyone as commenters and owned by users in domain 'example.com'":
    {
      where: {
        permissions: {
          [Op.contains]: [{
            role: 'commenter',
            type: 'anyone'
          }]
        }
      },
      include: [{
        model: User,
        as: 'user',
        where: {
          email: {
            [Op.like]: '%@example.com%'
          }
        }
      }]
    }

  - "Show files where lastSyncAttempt failed after a specific date":
    {
      where: {
        [Op.and]: [
          { syncStatus: 'failed' },
          { lastSyncAttempt: { [Op.gte]: new Date('2023-01-01') } }
        ]
      }
    }

  - "Show files where metadata contains a key 'project' with value 'alpha'":
    {
      where: {
        metadata: {
          [Op.contains]: { project: 'alpha' }
        }
      }
    }

  - "Show files where the user has uploaded more than 100 files":
    {
      include: [{
        model: User,
        as: 'user',
        where: {
          totalFiles: {
            [Op.gt]: 100
          }
        }
      }]
    }

  If the query cannot be generated or is unrelated, provide a clear and concise explanation.
`;

  constructor() {
    super();
  }

  async generateQuery({ query, page = 1, size = 10, baseConfig }) {
    await this.ensureInitialized();
    try {
      const cacheKey = `${query}-${page}-${size}`;
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
        if (aiQueryConfigRaw.includes("Error:")) {
          throw new Error("Error: Query is not searchable.");
        }
        return cachedResult;
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.systemPrompt,
          },
          {
            role: 'user',
            content: `Generate a Sequelize query for: "${query}". Page: ${page}, PageSize: ${size}. BaseConfig: ${JSON.stringify(baseConfig)}`,
          },
        ],
      });

      const aiQueryConfig = this.parseAIQueryConfig(response?.choices[0]?.message?.content)
      if (!aiQueryConfig) {
        throw new Error('Query is not related to file search or permissions.');
      }

      await cacheService.set(cacheKey, aiQueryConfig);

      return aiQueryConfig;
    } catch (error) {
      throw new Error(`AI query generation failed: ${error.message}`);
    }
  }
}

module.exports = new FilesOpenAIService();