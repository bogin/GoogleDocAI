const OpenAI = require('openai');
const cacheService = require('./cache.service');
require('sequelize');
const { Op } = require('sequelize');
const { File, FileOwner, User } = require('../models');
const systemSettingsService = require('./system-settings.service');
const BaseOpenAIService = require('./open-ai.abstract.service');

class OpenAIAnalyticsService extends BaseOpenAIService {
  constructor() {
    super();
    this.systemPrompt = `
    You are a SQL query generator for a database related to files, users, owners, and permissions. 
Generate valid Sequelize query objects for the following schemas and rules.

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
5. Ensure queries are related to files, users, file owners, and permissions.
6. Retrieve all data without applying any limit in params - unless its asked.
7. If a query involves finding records with no associated relationship (e.g., "files without users"), use required: false in the include clause and filter where the associated model's ID is null.
8. Return valid JavaScript code for the generated Sequelize query.
9. If a query cannot be handled, return an error message in the format: "Error: real error".

**Examples for queries:**
- "Show all users":
  {
    model: 'User',
    function: 'findAll',
    params: {}
  }

- "Show files owned by john@example.com":
  {
    model: 'File',
    function: 'findAll',
    params: {
      include: [{
        model: User,
        as: 'user',
        where: { email: 'john@example.com' }
      }]
    }
  }

- "Show files where anyone can comment":
  {
    model: 'File',
    function: 'findAll',
    params: {
      where: {
        permissions: {
          [Op.contains]: [{
            role: 'commenter',
            type: 'anyone'
          }]
        }
      }
    }
  }

- "Who owns the most files?":
  {
    model: 'User',
    function: 'findOne',
    params: {
      order: [['totalFiles', 'DESC']],
      limit: 1
    }
  }

- "Which file was modified most recently?":
  {
    model: 'File',
    function: 'findOne',
    params: {
      order: [['modifiedTime', 'DESC']],
      limit: 1
    }
  }

- "What is the average number of files per owner?":
  {
    model: 'User',
    function: 'findAll',
    params: {
      attributes: [
        [sequelize.fn('AVG', sequelize.col('totalFiles')), 'avgFiles']
      ]
    }
  }

- "Which file is the largest?":
  {
    model: 'File',
    function: 'findOne',
    params: {
      order: [['size', 'DESC']],
      limit: 1
    }
  }

- "What is the distribution of files by their last modified date?":
  {
    model: 'File',
    function: 'findAll',
    params: {
      attributes: ['modifiedTime', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['modifiedTime']
    }
  }
  
**Complex queries:**
- "Show files shared with anyone as commenters and owned by users in domain 'example.com'":
  {
    model: 'File',
    function: 'findAll',
    params: {
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
  }

        `;
  }

  async generateQuery({ query }) {
    await this.ensureInitialized();
    try {
      const cacheKey = `${query}`;
      const cachedResult = await cacheService.get(cacheKey);
      //   if (cachedResult) {
      //     return cachedResult;
      //   }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.systemPrompt,
          },
          {
            role: 'user',
            content: `Generate a Sequelize query function for: "${query}".`,
          },
        ],
      });

      let aiQueryConfigRaw = response?.choices[0]?.message?.content;

      if (aiQueryConfigRaw.includes("Error:")) {
        throw new Error("Error: Query is not related to file search.")
      }

      aiQueryConfigRaw = aiQueryConfigRaw
        ?.replace(/```(?:javascript)?\n?/, '')
        ?.replace(/(?:js)?\n?/, '')
        ?.replace(/(?:on)?\n?/, '')
        ?.replace(/```$/, '');

      let aiQueryConfig;
      try {
        aiQueryConfig = eval(`(${aiQueryConfigRaw})`);
      } catch (error) {
        throw new Error(`Failed to parse AI-generated query configuration: ${error.message}`);
      }

      if (!aiQueryConfig || !aiQueryConfig.model || !aiQueryConfig.function || !aiQueryConfig.params) {
        throw new Error('Query is not related to file search or permissions.');
      }

      await cacheService.set(cacheKey, aiQueryConfig);

      return aiQueryConfig;
    } catch (error) {
      throw new Error(`AI query generation failed: ${error.message}`);
    }
  }
}

module.exports = new OpenAIAnalyticsService();
