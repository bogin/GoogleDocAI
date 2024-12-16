const express = require('express');
const filesController = require('../controllers/files.controller');

const router = express.Router();

router.get('/', filesController.listFiles);
router.get(':fileId', filesController.getFile);
router.delete(':fileId', filesController.deleteFile);
router.patch(':fileId', filesController.updateFile);

module.exports = router;