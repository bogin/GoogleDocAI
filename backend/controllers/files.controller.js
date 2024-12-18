const filesService = require('../services/files.service');

class FilesController {
  async listFiles(req, res, next) {
    try {
      const { page, size, query, filters, pagination } = req.body;

      const result = await filesService.listAllFiles({
        page: page ? parseInt(page) : undefined,
        size: size ? parseInt(size) : undefined,
        query,
        filters: filters ? JSON.parse(filters) : undefined
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getFile(req, res, next) {
    try {
      const file = await filesService.getFileById(req.params.fileId);
      res.json(file);
    } catch (error) {
      next(error);
    }
  }

  async deleteFile(req, res, next) {
    try {
      await filesService.deleteFileById(req.params.fileId);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateFile(req, res, next) {
    try {
      const updatedFile = await filesService.updateFileById(
        req.params.fileId,
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
