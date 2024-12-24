const filesService = require('../services/files.service');

class FilesController {
  async listFiles(req, res, next) {
    try {
      const { page = 1, size = 10, filters } = req.body;
      const parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;

      const result = await filesService.listAllFiles({
        page: parseInt(page),
        size: parseInt(size),
        filters: parsedFilters
      });

      res.json(result);
    } catch (error) {
      res.json({ error: error.message });
      next(error);
    }
  }

  async getFile(req, res, next) {
    try {
      const { fileId } = req.params;
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
      const { fileId } = req.params;
      await filesService.deleteFileById(fileId);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateFile(req, res, next) {
    try {
      const { fileId } = req.params;
      const updatedFile = await filesService.updateFileById(fileId, req.body);
      res.json(updatedFile);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FilesController();