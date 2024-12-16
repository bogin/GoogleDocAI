const googleService = require('./google.service');
const DEFUALTS = {
    pageSize: 10,
};

class FilesService {
  async listAllFiles({ pageSize, pageToken, query, modifiedAfter }) {
    return googleService.listFiles({ pageSize: pageSize ? parseInt(pageSize) : DEFUALTS.pageSize, pageToken, query, modifiedAfter });
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