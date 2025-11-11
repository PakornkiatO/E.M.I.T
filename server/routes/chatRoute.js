const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getHistory, deleteMessage, clearHistory } = require('../controllers/chatController');

// Get chat history with other user
router.get('/history/:other', auth, getHistory);
router.delete('/message/:id', auth, deleteMessage);
router.delete('/history/:other', auth, clearHistory);

module.exports = router;
