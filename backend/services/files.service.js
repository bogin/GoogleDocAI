const { Op } = require('sequelize');
const filesRepository = require('../repo/files.repository');
const openaiService = require('./openai/openai-files.service');
const { sequelize } = require('../models');
const { uniqBy } = require('lodash');

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
    const toCamelCase = (str) => {
      return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    };

    const convertToCamelCase = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => convertToCamelCase(item));
      }

      if (obj && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
          const camelKey = toCamelCase(key);
          const value = obj[key];
          result[camelKey] = convertToCamelCase(value);
          return result;
        }, {});
      }

      return obj;
    };

    return convertToCamelCase(file);
  }

  processFilePermissions(files) {
    return files.map(file => {
      const fileData = !!file?.toJSON ? file.toJSON() : this.getInCamalCase(file);
      const permissions = file.permissions || [];

      fileData.owners = this.extractOwners(permissions);
      fileData.commenters = this.extractCommenters(permissions);
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

  extractCommenters(permissions) {
    return permissions
      .filter(p => p.role === 'commenter')
      .map(p => ({
        type: p.type,
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
      order: [['modifiedTime', 'DESC']]
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

  async createFile(fileData) {
    return await filesRepository.create(fileData);
  }

  async updateFileById(fileId, metadata) {
    return await filesRepository.update(fileId, metadata);
  }

  async deleteFileById(fileId) {
    return await filesRepository.delete(fileId);
  }
}

module.exports = new FilesService();