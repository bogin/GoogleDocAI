const OpenAI = require('openai');
const { Op } = require('sequelize');
const cacheService = require('./cache.service');
require('sequelize')

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.systemPrompt = `
      You are a SQL query generator for a Google Drive files database.
      Generate valid Sequelize query objects based on the following schema:

      File Model:
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
      - permissions: jsonb [] (contains array of permissions with fields: id, role (owner/commenter/reader), type (user/anyone), emailAddress, displayName)
      - capabilities: jsonb
      - syncStatus: string
      - lastSyncAttempt: timestamp
      - metadata: jsonb

      Permission Types in files.permissions:
      - owner: Full access to the file
      - commenter: Can comment but not edit
      - reader: Can only view
      - writer: Can edit the file

      Access Types in files.permissions:
      - user: Individual user access
      - anyone: Public/link access
      - group: Group access
      - domain: Domain-wide access

      Examples of permission-based queries:
      - "Show files owned by john@example.com" →
        {
          where: {
            permissions: {
              [Op.contains]: [{
                role: 'owner',
                type: 'user',
                emailAddress: 'john@example.com'
              }]
            }
          }
        }
      
      - "Show files where anyone can comment" →
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

      - "Show files with multiple owners" →
        {
          where: {
            [Op.and]: [
              {
                permissions: {
                  [Op.jsonPath]: '$.#(role == "owner" && type == "user").size() > 1'
                }
              }
            ]
          }
        }

      - "Show files shared with domain users as commenters" →
        {
          where: {
            permissions: {
              [Op.contains]: [{
                role: 'commenter',
                type: 'domain'
              }]
            }
          }
        }

      Rules:
      1. Always use Op.contains for searching within the permissions JSONB array
      2. For ownership queries, always check both role='owner' and type='user'
      3. For public access, use type='anyone'
      4. For complex permission queries, use Op.jsonPath when needed
      5. Return error if query is not related to file search or permissions
      `;
  }

  async generateQuery({ query, page = 1, size = 10, baseConfig }) {
    try {
      const cacheKey = `${query}-${page}-${size}`;
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
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

      let aiQueryConfigRaw = response?.choices[0]?.message?.content;

      if (aiQueryConfigRaw.includes("Query is not") || aiQueryConfigRaw.includes("The query provided is not related to file search or permissions.")) {
        throw new Error("Error: Query is not related to file search.")
      }

      aiQueryConfigRaw = aiQueryConfigRaw
        ?.replace(/```(?:javascript)?\n?/, '')
        ?.replace(/(?:js)?\n?/, '')
        ?.replace(/```$/, '');

      let aiQueryConfig;
      try {
        aiQueryConfig = eval(`(${aiQueryConfigRaw})`);
      } catch (error) {
        throw new Error(`Failed to parse AI-generated query configuration: ${error.message}`);
      }

      if (!aiQueryConfig || (!aiQueryConfig.where && !aiQueryConfig.include)) {
        throw new Error('Query is not related to file search or permissions.');
      }

      await cacheService.set(cacheKey, aiQueryConfig);

      return aiQueryConfig;
    } catch (error) {
      throw new Error(`AI query generation failed: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();