const { validationResult } = require('express-validator');
const filesService = require('../services/files.service');

class FilesController {
  async listFiles(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { page = 1, size = 10, filters } = req.body;

      // Validate pagination parameters
      if (page < 1 || size < 1 || size > 100) {
        return res.status(400).json({
          error: 'Invalid pagination parameters'
        });
      }

      // Validate and parse filters safely
      let parsedFilters;
      if (filters) {
        try {
          parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
        } catch (e) {
          return res.status(400).json({
            error: 'Invalid filters format'
          });
        }
      }

      const result = await filesService.listAllFiles({
        page: parseInt(page),
        size: parseInt(size),
        filters: parsedFilters
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getFile(req, res, next) {
    try {
      const fileId = req.params.fileId;
      if (!fileId || typeof fileId !== 'string') {
        return res.status(400).json({
          error: 'Invalid file ID'
        });
      }

      const file = await filesService.getFileById(fileId);
      if (!file) {
        return res.status(404).json({
          error: 'File not found'
        });
      }
      res.json(file);
    } catch (error) {
      next(error);
    }
  }

  async deleteFile(req, res, next) {
    try {
      const fileId = req.params.fileId;
      if (!fileId || typeof fileId !== 'string') {
        return res.status(400).json({
          error: 'Invalid file ID'
        });
      }

      await filesService.deleteFileById(fileId);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateFile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const fileId = req.params.fileId;
      if (!fileId || typeof fileId !== 'string') {
        return res.status(400).json({
          error: 'Invalid file ID'
        });
      }

      const updatedFile = await filesService.updateFileById(
        fileId,
        req.body
      );
      res.json(updatedFile);
    } catch (error) {
      next(error);
    }
  }
}

const filesController = new FilesController();
module.exports = filesController;