const { sequelize } = require('../models');
const openAIService = require('./openai/openai-analytics.service');
const { uniqBy } = require('lodash');
const mongoFileOpenAIService = require('./openai/openai-mongo.service');
const mongoFileRepository = require('../repo/file.mongo.repository');
const filesRepository = require('../repo/files.repository');
const { Op } = require('sequelize');
const filesService = require('./files.service');

class AnalyticsService {
    async analyzeQuery(query) {
        try {
            const contentRelatedResults = await this.getMongoSearchResults(query);
            const metadataRelatedResult = await this.getPostgresSearcResultsQuery(query)
            const result = await this.mergeMetatadataAndContentFiles(contentRelatedResults, metadataRelatedResult);
            return {
                success: true,
                query,
                result: [
                    {['Files found that has relations: ']: result},
                    {['Big metadata data search results']: metadataRelatedResult},
                    {['Content related results']: contentRelatedResults}
                ]
            };

        } catch (error) {

            return {
                success: false,
                query: query,
                error: error.message,
            };
        }
    }

    async mergeMetatadataAndContentFiles(contentRelatedResults, metadataRelatedResult) {
        const contentRelatedByFileID = contentRelatedResults.reduce((hash, item) => {
            hash[item.fileId] = item;
            return hash;
        }, {});

        metadataRelatedResult.forEach((file) => {
            file.content = contentRelatedByFileID[file.id];
            delete contentRelatedByFileID[file.id];
        });


        const { rows: contentReleatedMeta } = await filesRepository.findAll({
            where: {
                id: { [Op.in]: Object.keys(contentRelatedByFileID) }
            }
        });

        const missingFiles = contentReleatedMeta.map((file) => {
            file = file.toJSON();
            file.content = contentRelatedByFileID[file.id];
            return file;
        });

        const result = [...(metadataRelatedResult || []), ...(missingFiles || [])];
        return result;
    }

    async getPostgresSearcResultsQuery(query) {
        let queryString;
        try {
            queryString = await openAIService.generateQuery({
                query
            });

            const [result] = await sequelize.query(queryString);
            return uniqBy(result, 'id').map((file) => {
                return filesService.getInCamalCase(file)
            });
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async getMongoSearchResults(query) {
        try {
            const contentQuery = await mongoFileOpenAIService.generateQuery({ query });
            const mongoResults = await mongoFileRepository.aggregateSearch(contentQuery)
            const result = uniqBy(mongoResults, 'fileId').map((file) => {
                return filesService.getInCamalCase(file)
            });
            return result;

        } catch (error) {
            console.error(error);
            return [];
        }
    }
}

module.exports = new AnalyticsService();
