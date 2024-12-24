const { Op } = require('sequelize');
const { isEmpty } = require("lodash");
const filesRepository = require('../repo/files.repository');
const openaiService = require('./openai/openai-files.service');

const PAGINATION_DEFAULTS = {
  page: 1,
  size: 10,
};

class FilesService {
  async listAllFiles(options = {}) {
    const page = options.page ? parseInt(options.page) : PAGINATION_DEFAULTS.page;
    const size = options.size ? parseInt(options.size) : PAGINATION_DEFAULTS.size;

    const queryConfig = await this.buildQueryConfig({ page, size, filters: options?.filters || {} });
    const { count, rows } = await filesRepository.findAll(queryConfig);
    
    const processedFiles = this.processFilePermissions(rows);
    return this.buildPaginatedResponse(processedFiles, count, page, size);
  }

  processFilePermissions(files) {
    return files.map(file => {
      const fileData = file.toJSON();
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

  async buildQueryConfig({ page, size, filters }) {
    const queryConfig = this.buildBaseQueryConfig(page, size);

    if (filters.modifiedTime) {
      try {
        queryConfig.where.modifiedTime = {
          [Op.gte]: filters.modifiedTime
        };
      } catch (error) {
        console.error('Invalid date format:', error);
      }
    }

    if (filters?.query) {
      await this.enrichQueryConfigWithAI(filters.query, page, size, queryConfig);
    }

    return queryConfig;
  }

  buildBaseQueryConfig(page, size) {
    return {
      where: {},
      limit: size,
      offset: (page - 1) * size,
      order: [['modifiedTime', 'DESC']]
    };
  }

  async enrichQueryConfigWithAI(query, page, size, queryConfig) {
    try {
      const aiQueryConfig = await openaiService.generateQuery({
        query,
        page,
        size,
        baseConfig: queryConfig
      });

      this.mergeAIQueryConditions(queryConfig, aiQueryConfig);
    } catch (error) {
      throw new Error(`Invalid query parameters: ${error.message}`);
    }
  }

  mergeAIQueryConditions(queryConfig, aiQueryConfig) {
    if (aiQueryConfig.where) {
      queryConfig.where = this.mergeWhereConditions(queryConfig.where, aiQueryConfig.where);
    }

    if (aiQueryConfig.order) {
      queryConfig.order = aiQueryConfig.order;
    }
  }

  mergeWhereConditions(existingWhere, aiWhere) {
    const conditions = [];

    if (!isEmpty(existingWhere)) {
      conditions.push(existingWhere);
    }

    if (!isEmpty(aiWhere)) {
      conditions.push(aiWhere);
    }

    return conditions.length > 1 ? { [Op.and]: conditions } : conditions[0] || {};
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