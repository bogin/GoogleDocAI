const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async askQuestion(question, fileData) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant analyzing Google Drive files data."
          },
          {
            role: "user",
            content: `Given this file data: ${JSON.stringify(fileData)}\n\nQuestion: ${question}`
          }
        ]
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
}

const openaiService = new OpenAIService();
module.exports = openaiService;
