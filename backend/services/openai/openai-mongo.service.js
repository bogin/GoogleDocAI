const BaseOpenAIService = require('./open-ai.abstract.service');
const cacheService = require('./cache.service');

class MongoFileOpenAIService extends BaseOpenAIService {
  systemPrompt = `
    You are a MongoDB aggregation pipeline generator. Generate valid MongoDB aggregation pipelines for searching file content.
    The collection has the following schema:

    FileContent:
      - fileId: String (unique)
      - content: String (text indexed)
      - mimeType: String
      - lastSync: Date
      - createdAt: Date
      - updatedAt: Date

    Rules:
    1. Always include proper text search stages when searching content.
    2. Use proper date handling for temporal queries.
    3. Include pagination stage if you recive value.
    4. Generate projections for relevant fields such as fileId, content snippet, and mimeType.
    5. Use proper MongoDB operators.

    Example queries and pipelines:

    1. "Find documents containing 'project report'":
    [
      {
        $match: {
          $text: { $search: "project report" }
        }
      }
    ]

    2. "Find recent PDF files mentioning 'budget'":
    [
      {
        $match: {
          $text: { $search: "budget" },
          mimeType: "application/pdf",
          lastSync: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
        }
      }
    ]

    Return only the pipeline array without extra text.
     If the query cannot be generated or is unrelated, I will provide a clear and concise explanation in this format:
      "Error: [Specific error message]. [Natural language explanation of the issue]"
    `;

  constructor() {
    super('mongoFilesKey');
  }

  async generateQuery({ query, page, size }) {
    await this.ensureInitialized();
    try {
      const cacheKey = `mongo_pipeline_${query}_${page}_${size}`;
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) return cachedResult;

      let queryPrompt = `Generate MongoDB pipeline for: "${query}".`
      if (page || size) {
        queryPrompt = `${queryPrompt} with pagination (page: ${page}, size: ${size}).`
      }
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
            content: queryPrompt
          }
        ]
      });

      const cleanedQuery = this.cleanAndParsePipeline(response?.choices[0]?.message?.content);

      if (!(typeof cleanedQuery === "String" && cleanedQuery.includes("Error:"))) {
        if (page && size) {
          cleanedQuery.push({
            $skip: (page - 1) * size
          });
        } else if (size) {
          cleanedQuery.push({
            $limit: size
          });
        }

        await cacheService.set(cacheKey, cleanedQuery);
      } else {
        throw new Error(cleanedQuery)
      }

      return cleanedQuery;

    } catch (error) {
      throw new Error(`AI pipeline generation failed: ${error.message}`);
    }
  }

  cleanAndParsePipeline(content) {
    if (!content) return null;

    try {
      const cleaned = content
        .replace(/```json?\n?/g, '')
        .replace(/```/g, '')
        .trim();

      return cleaned;
    } catch (error) {
      console.error('Pipeline parsing error:');
      return null;
    }
  }
}
const mongoFileOpenAIService = new MongoFileOpenAIService();
module.exports = mongoFileOpenAIService
