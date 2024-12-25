const BaseOpenAIService = require('./open-ai.abstract.service');

class GrammarAgentService extends BaseOpenAIService {
    constructor() {
        super();
        this.systemPrompt = `
      You are a grammar and tone expert. Your job is to fix typos, correct grammar, and rewrite text into clear, professional language without changing its meaning. Ensure the output uses formal language.
    `;
    }

    async processText(text) {
        const response = await this.createChatCompletion([
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: text },
        ]);
        return response.choices[0].message.content;
    }
}
const grammarAgentService = new GrammarAgentService();
module.exports = grammarAgentService;
