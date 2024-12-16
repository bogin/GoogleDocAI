const googleService = require('./googleService');

class FilesService {
  async listAllFiles(params) {
    return googleService.listFiles(params);
  }

  async getFileById(fileId) {
    return googleService.getFile(fileId);
  }

  async deleteFileById(fileId) {
    return googleService.deleteFile(fileId);
  }

  async updateFileById(fileId, metadata) {
    return googleService.updateFile(fileId, metadata);
  }
}

const filesService = new FilesService();
module.exports = filesService;