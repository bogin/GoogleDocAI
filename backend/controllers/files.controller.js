const filesService = require('../services/files.service');

class FilesController {
  async listFiles(req, res, next) {
    try {
      const { pageSize, pageToken, query, modifiedAfter } = req.query;
      const files = await filesService.listAllFiles({
        pageSize,
        pageToken,
        query,
        modifiedAfter
      });
      res.json(files);
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
