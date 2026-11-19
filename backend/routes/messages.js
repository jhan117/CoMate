const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const messageController = require('../controllers/messageController');

router.use(requireAuth);

router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.openOrCreateConversation);
router.get(
  '/conversations/:conversationId',
  messageController.getConversationMessages
);
router.patch(
  '/conversations/:conversationId/read',
  messageController.markConversationAsRead
);
router.post(
  '/conversations/:conversationId/messages',
  messageController.createMessage
);
router.patch('/:id', messageController.updateMessage);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
