const OpenAI = require('openai');
const systemSettingsService = require('../services/system-settings.service');

class BaseOpenAIService {
    constructor() {
        this.openai = null;
        this.systemPrompt = '';
        this.initialize();
    }

    async ensureInitialized() {
        if (!this.openai) {
            await this.initialize();
        }
    }

    async initialize() {
        try {
            const settings = await systemSettingsService.get('openai');
            if (!settings || !settings.value.apiKey) {
                throw new Error('OpenAI API key not found in settings');
            }

            this.openai = new OpenAI({
                apiKey: settings.value.apiKey,
            });
        } catch (error) {
            console.error('Failed to initialize OpenAI:', error);
            throw error;
        }
    }

    // Abstract method that child classes must implement
    async generateQuery(params) {
        throw new Error('generateQuery method must be implemented by child class');
    }

    async createChatCompletion(messages, model = 'gpt-3.5-turbo') {
        await this.ensureInitialized();
        return this.openai.chat.completions.create({
            model,
            messages,
        });
    }
}

module.exports = BaseOpenAIService;