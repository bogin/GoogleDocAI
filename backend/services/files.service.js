const { Op } = require('sequelize');
const filesRepository = require('../repo/files.repository');
const openaiService = require('./openai/openai-files.service');
const { sequelize } = require('../models');
const { uniqBy } = require('lodash');
const googleService = require('./google.service');
const mongoFileRepository = require('../repo/file.mongo.repository');

const PAGINATION_DEFAULTS = {
  page: 1,
  size: 10,
};

class FilesService {
  async listAllFiles(options = {}) {
    const page = options.page ? parseInt(options.page) : PAGINATION_DEFAULTS.page;
    const size = options.size ? parseInt(options.size) : PAGINATION_DEFAULTS.size;

    const queryConfig = this.buildBaseQueryConfig(page, size);

    if (options?.filters?.modifiedTime) {
      queryConfig.where.modifiedTime = {
        [Op.gte]: new Date(options.filters.modifiedTime).toISOString()
      };
    }

    let count, rows;
    if (options?.filters?.query) {
      const string = await this.getQueryStringWithAI(options.filters.query, page, size, queryConfig);

      const [results, metadata] = await sequelize.query(string);
      rows = uniqBy(results, 'id');
      count = metadata.rowCount
    } else {
      const results = await filesRepository.findAll(queryConfig);
      rows = results.rows;
      count = results.count;
    }

    const processedFiles = this.processFilePermissions(rows);
    return this.buildPaginatedResponse(processedFiles, count, page, size);
  }

  getInCamalCase(file) {
    const result = {};

    for (const [key, value] of Object.entries(file)) {
      const transformedKey = key.startsWith('_')
        ? `${key.slice(1).replace(/_([a-z])/g, (_, char) => char.toUpperCase())}`
        : key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());

      result[transformedKey] = value;
    }

    return result;

  }

  processFilePermissions(files) {
    return files.map(file => {
      const fileData = !!file?.toJSON ? file.toJSON() : this.getInCamalCase(file);
      const permissions = file.permissions || [];

      fileData.owners = this.extractOwners(permissions);
      fileData.publicAccess = this.extractPublicAccess(permissions);

      return fileData;
    });
  }

  extractOwners(permissions) {
    return permissions
      .filter(p => p.role === 'owner' && p.type === 'user')
      .map(p => ({
        email: p.emailAddress,
        displayName: p.displayName
      }));
  }

  extractPublicAccess(permissions) {
    return permissions.find(p => p.type === 'anyone')?.role || 'none';
  }

  buildPaginatedResponse(files, totalCount, currentPage, pageSize) {
    return {
      files,
      pagination: {
        currentPage,
        pageSize,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: currentPage * pageSize < totalCount,
      }
    };
  }

  buildBaseQueryConfig(page, size) {
    return {
      where: {
        deletedAt: null
      },
      limit: size,
      offset: (page - 1) * size,
      order: [['modifiedTime', 'DESC']],
      include: filesRepository.getDefaultInclude()
    };
  }

  async getQueryStringWithAI(query, page, size, queryConfig) {
    try {
      const aiQueryString = await openaiService.generateQuery({
        query,
        page,
        size,
        queryConfig,
      });

      return aiQueryString;
    } catch (error) {
      throw new Error(`Invalid query parameters: ${error.message}`);
    }
  }

  async getFileById(fileId) {
    return await filesRepository.findById(fileId);
  }

  async updateFileById(fileId, metadata) {
    const res = await filesRepository.update(fileId, metadata);
    const response = await googleService.getFileContent(fileId)
    await mongoFileRepository.upsertWithMetadata(response.data, res);
    return res;
  }

  async deleteFileById(fileId) {
    await mongoFileRepository.deleteFile(fileId);
    return await filesRepository.delete(fileId);
  }
}

module.exports = new FilesService();
