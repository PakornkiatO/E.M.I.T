const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getHistory, deleteMessage, clearHistory, listGroups, createGroup, joinGroup, deleteGroupMessage, clearGroupHistory } = require('../controllers/chatController');

// Get chat history with other user
router.get('/history/:other', auth, getHistory);
router.delete('/message/:id', auth, deleteMessage);
router.delete('/history/:other', auth, clearHistory);
// group endpoints
router.get('/groups', auth, listGroups);
router.post('/groups', auth, createGroup);
router.post('/groups/:id/join', auth, joinGroup);
router.delete('/groups/:id/messages/:msgId', auth, deleteGroupMessage);
router.delete('/groups/:id/history', auth, clearGroupHistory);

module.exports = router;
