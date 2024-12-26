const FileContent = require('../mongoModels/file.model');
const mongoFileOpenAIService = require('../services/openai/openai-mongo.service');

class MongoFileRepository {
    async upsertFile(fileId, content, mimeType) {
        try {
            return await FileContent.findOneAndUpdate(
                { fileId },
                {
                    content,
                    mimeType,
                    lastSync: new Date()
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error upserting file content:', error);
            throw error;
        }
    }

    async upsertFileFromResponse(response) {
        try {
            // Extracting necessary details from the response
            const fileId = response.request.responseURL.split('/')[6];
            const content = response.data;
            const mimeType = response.headers['content-type'];

            // Upsert operation
            return await FileContent.findOneAndUpdate(
                { fileId },
                {
                    content,
                    mimeType,
                    lastSync: new Date(),
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error upserting file content from response:', error);
            throw error;
        }
    }

    async findByFileId(fileId) {
        try {
            return await FileContent.findOne({ fileId });
        } catch (error) {
            console.error('Error finding file content:', error);
            throw error;
        }
    }

    async searchContent(query, options = {}) {
        try {
            const { skip = 0, limit = 10, sort = { lastSync: -1 } } = options;

            const searchQuery = {
                $text: { $search: query },
            };

            const [results, total] = await Promise.all([
                FileContent.find(searchQuery)
                    .skip(skip)
                    .limit(limit)
                    .sort(sort)
                    .lean(),
                FileContent.countDocuments(searchQuery),
            ]);

            return {
                results,
                total,
                page: Math.floor(skip / limit) + 1,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            console.error('Error searching file content:', error);
            throw error;
        }
    }

    async getSearchResults(query) {
        try {
            const pipeline = await mongoFileOpenAIService.generatePipeline({ query });
            return await FileContent.aggregate(pipeline).toArray();
        } catch (error) {
            console.error('Error fetching search results:', error);
            throw error;
        }
    }


    async aggregateSearch(pipelineString) {
        try {
            const pipeline = eval(pipelineString);
            const results = await FileContent.aggregate(pipeline, { maxTimeMS: 60000 });

            return results;
        } catch (error) {
            console.error('Error in aggregate search:', error);
            throw error;
        }
    }

    async deleteFile(fileId) {
        try {
            return await FileContent.findOneAndDelete({ fileId });
        } catch (error) {
            console.error('Error deleting file content:', error);
            throw error;
        }
    }

    async getContentStats() {
        try {
            return await FileContent.aggregate([
                {
                    $group: {
                        _id: null,
                        totalFiles: { $sum: 1 },
                        avgContentLength: { $avg: { $strLenCP: "$content" } },
                        lastUpdate: { $max: "$lastSync" },
                    },
                },
            ]);
        } catch (error) {
            console.error('Error getting content stats:', error);
            throw error;
        }
    }
}

const mongoFileRepository = new MongoFileRepository();
module.exports = mongoFileRepository;