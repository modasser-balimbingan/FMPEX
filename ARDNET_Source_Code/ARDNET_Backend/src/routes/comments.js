const express = require('express');
const commentsController = require('../controllers/commentsController');
const { verifyToken, requireRole } = require('../middleware/auth');

const commentsRouter = express.Router();
commentsRouter.put('/:commentId', verifyToken, requireRole('farmer', 'buyer'), commentsController.updateComment);
commentsRouter.delete('/:commentId', verifyToken, requireRole('farmer', 'buyer'), commentsController.deleteComment);

const adminCommentsRouter = express.Router();
adminCommentsRouter.patch('/:commentId/moderate', verifyToken, requireRole('admin'), commentsController.moderateComment);

module.exports = { commentsRouter, adminCommentsRouter };
