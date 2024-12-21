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
      - userId: integer (foreign key to users table)
      - lastModifyingUser: jsonb
      - permissions: jsonb
      - capabilities: jsonb
      - syncStatus: string
      - lastSyncAttempt: timestamp
      - errorLog: jsonb
      - metadata: jsonb

      User Model:
      - id: integer (primary key)
      - email: string
      - displayName: string
      - photoLink: string
      - totalFiles: integer
      - totalSize: bigint

      Rules:
      1. Only generate Sequelize queries for user-provided search queries related to files.
      2. If the input query is not directly translatable to a valid Sequelize file search, return an error message: "Query is not related to file search."
      3. Return only valid Sequelize query configurations.

      For example:
      - "Show files where name starts with 'B'" → { where: { name: { [Op.iLike]: 'B%' } } }
      - "Show files larger than 100MB" → { where: { size: { [Op.gt]: 104857600 } } }
      - "Show files from user with email 'test@example.com'" →
        {
          include: [{
            model: User,
            as: 'user',
            where: { email: 'test@example.com' }
          }]
        }
      
      - "Show files larger than 100MB owned by users with user name containing 'John'" →
        {
          where: { size: { [Op.gt]: '104857600' } },
          include: [{
            model: User,
            as: 'user',
            where: { displayName: { [Op.iLike]: '%John%' } }
          }]
        }

       - "Show files from users with more than 100 files" → 
        { 
          include: [{
            model: User,
            as: 'user',
            where: { totalFiles: { [Op.gt]: 100 } }
          }]
        }
      If the query does not match the criteria, return an error.
    `;
  }

  async generateQuery({ query, page = 1, size = 10, baseConfig }) {
    try {
      // Cache based on query, not filters
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

      if (aiQueryConfigRaw.includes("Query is not")) {
        throw new Error("Error: Query is not related to file search.")
      }
      // Remove backticks and language identifier if present
      aiQueryConfigRaw = aiQueryConfigRaw
        ?.replace(/```(?:javascript)?\n?/, '')
        ?.replace(/(?:js)?\n?/, '')
        ?.replace(/```$/, '');

      // Convert the raw string into a JavaScript object
      let aiQueryConfig;
      try {
        aiQueryConfig = eval(`(${aiQueryConfigRaw})`);
      } catch (error) {
        throw new Error(`Failed to parse AI-generated query configuration: ${error.message}`);
      }

      // Validate the AI-generated query
      if (!aiQueryConfig || !aiQueryConfig.where || Object.keys(aiQueryConfig.where).length === 0) {
        throw new Error('Query is not related to file search.');
      }

      // Cache the result in both Redis and memory
      await cacheService.set(cacheKey, aiQueryConfig);

      return aiQueryConfig;
    } catch (error) {
      throw new Error(`AI query generation failed: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();
