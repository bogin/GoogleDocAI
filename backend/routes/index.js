const express = require('express');
const filesController = require('../controllers/filesController');

const router = express.Router();

router.get('/files', filesController.listFiles);
router.get('/files/:fileId', filesController.getFile);
router.delete('/files/:fileId', filesController.deleteFile);
router.patch('/files/:fileId', filesController.updateFile);


module.exports = router;