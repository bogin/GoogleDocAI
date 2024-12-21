const express = require('express');
const filesController = require('../controllers/files.controller');

const router = express.Router();

router.post('/', filesController.listFiles);
router.get(':fileId', filesController.getFile);
router.delete('/:fileId', filesController.deleteFile);
router.put('/:fileId', filesController.updateFile);

module.exports = router;