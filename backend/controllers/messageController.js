const messageModel = require('../models/messageModel');
const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel');
const { emitToUser } = require('../socket');
const { cleanText, isIntegerId } = require('../utils/validation');

function stripInternalParticipants(chatMessage) {
  if (!chatMessage) return null;
  const { user1Id: _u1, user2Id: _u2, ...rest } = chatMessage;
  return rest;
}

async function markConversationReadAndNotify(conversation, readerUserId) {
  const [readMessageIds, notificationCleared] = await Promise.all([
    messageModel.markConversationMessagesAsRead(conversation.id, readerUserId),
    notificationModel.markMessageNotificationsAsReadByConversation(
      readerUserId,
      conversation.id
    ),
  ]);

  const partnerId =
    conversation.user1Id === readerUserId
      ? conversation.user2Id
      : conversation.user1Id;

  const [readerConversation, partnerConversation] = await Promise.all([
    messageModel.findConversationById(conversation.id, readerUserId),
    messageModel.findConversationById(conversation.id, partnerId),
  ]);

  if (readMessageIds.length > 0) {
    emitToUser(partnerId, 'message:read', {
      conversationId: conversation.id,
      readerId: readerUserId,
      readMessageIds,
      conversation: partnerConversation,
    });
  }

  if (notificationCleared || readMessageIds.length > 0) {
    emitToUser(readerUserId, 'notification:updated', {
      conversationId: conversation.id,
    });
  }

  return {
    readMessageIds,
    readerConversation,
  };
}

const messageController = {
  // 1. 내 대화방 목록 조회 (GET /api/messages/conversations)
  async getConversations(req, res) {
    const sessionUserId = req.userId;
    const conversations = await messageModel.findConversationsByUserId(sessionUserId);

    return res.status(200).json({ conversations });
  },

  // 2. 대화방 열기 또는 생성 (POST /api/messages/conversations)
  async openOrCreateConversation(req, res) {
    const sessionUserId = req.userId;
    const recipientId = cleanText(req.body?.recipientId);
    const postId = cleanText(req.body?.postId);

    if (!recipientId) {
      return res
        .status(400)
        .json({ message: '쪽지를 보낼 상대방을 선택해 주세요.' });
    }

    if (!isIntegerId(recipientId)) {
      return res
        .status(404)
        .json({ message: '상대방 사용자를 찾을 수 없습니다.' });
    }

    if (String(recipientId) === String(sessionUserId)) {
      return res
        .status(400)
        .json({ message: '본인에게는 쪽지를 보낼 수 없습니다.' });
    }

    const recipientRow = await userModel.findById(recipientId);
    const recipient = recipientRow ? userModel.publicUser(recipientRow) : null;
    if (!recipient) {
      return res
        .status(404)
        .json({ message: '상대방 사용자를 찾을 수 없습니다.' });
    }

    if (postId) {
      if (!isIntegerId(postId)) {
        return res
          .status(404)
          .json({ message: '연결할 모집글을 찾을 수 없습니다.' });
      }
      const post = await messageModel.findPostBriefById(postId);
      if (!post) {
        return res
          .status(404)
          .json({ message: '연결할 모집글을 찾을 수 없습니다.' });
      }
    }

    const { conversation, created } = await messageModel.findOrCreateConversation({
      userAId: sessionUserId,
      userBId: recipient.id,
      postId: postId || null,
    });

    return res.status(created ? 201 : 200).json({
      message: created
        ? '새 대화방이 생성되었습니다.'
        : '대화방을 불러왔습니다.',
      conversation,
      created,
    });
  },

  // 3. 특정 대화방 상세, 메시지 내역 조회 및 읽음 처리 (GET /api/messages/conversations/:conversationId)
  async getConversationMessages(req, res) {
    const conversationId = cleanText(req.params.conversationId);
    if (!isIntegerId(conversationId)) {
      return res.status(404).json({ message: '대화방을 찾을 수 없습니다.' });
    }

    const sessionUserId = req.userId;
    const conversation = await messageModel.findConversationById(
      conversationId,
      sessionUserId
    );

    if (!conversation) {
      return res.status(404).json({ message: '대화방을 찾을 수 없습니다.' });
    }

    const isParticipant =
      conversation.user1Id === sessionUserId ||
      conversation.user2Id === sessionUserId;

    if (!isParticipant) {
      return res.status(403).json({
        message: '참여 중인 대화방만 열람할 수 있습니다.',
      });
    }

    const { readerConversation } = await markConversationReadAndNotify(
      conversation,
      sessionUserId
    );

    const messages = await messageModel.findMessagesByConversationId(
      conversation.id
    );

    return res.status(200).json({
      conversation: readerConversation || conversation,
      messages: messages.map(stripInternalParticipants),
    });
  },

  // 4. 대화방 내 수신 쪽지 읽음 처리 (PATCH /api/messages/conversations/:conversationId/read)
  async markConversationAsRead(req, res) {
    const conversationId = cleanText(req.params.conversationId);
    if (!isIntegerId(conversationId)) {
      return res.status(404).json({ message: '대화방을 찾을 수 없습니다.' });
    }

    const sessionUserId = req.userId;
    const conversation = await messageModel.findConversationById(
      conversationId,
      sessionUserId
    );

    if (!conversation) {
      return res.status(404).json({ message: '대화방을 찾을 수 없습니다.' });
    }

    const isParticipant =
      conversation.user1Id === sessionUserId ||
      conversation.user2Id === sessionUserId;

    if (!isParticipant) {
      return res.status(403).json({
        message: '참여 중인 대화방만 읽음 처리할 수 있습니다.',
      });
    }

    const { readMessageIds, readerConversation } =
      await markConversationReadAndNotify(conversation, sessionUserId);

    return res.status(200).json({
      message: '쪽지를 읽음 처리했습니다.',
      readMessageIds,
      conversation: readerConversation || conversation,
    });
  },

  // 5. 쪽지 메시지 전송 (POST /api/messages/conversations/:conversationId/messages)
  async createMessage(req, res) {
    const conversationId = cleanText(req.params.conversationId);
    if (!isIntegerId(conversationId)) {
      return res.status(404).json({ message: '대화방을 찾을 수 없습니다.' });
    }

    const content = cleanText(req.body?.content);
    if (!content) {
      return res.status(400).json({ message: '쪽지 내용을 입력해 주세요.' });
    }
    if (content.length > 1000) {
      return res.status(400).json({
        message: '쪽지 내용은 1000자 이하로 입력해 주세요.',
      });
    }

    const sessionUserId = req.userId;
    const conversation = await messageModel.findConversationById(
      conversationId,
      sessionUserId
    );

    if (!conversation) {
      return res.status(404).json({ message: '대화방을 찾을 수 없습니다.' });
    }

    const isParticipant =
      conversation.user1Id === sessionUserId ||
      conversation.user2Id === sessionUserId;

    if (!isParticipant) {
      return res.status(403).json({
        message: '참여 중인 대화방에만 쪽지를 보낼 수 있습니다.',
      });
    }

    const createdRaw = await messageModel.createMessage({
      conversationId: conversation.id,
      senderId: sessionUserId,
      content,
    });
    const chatMessage = stripInternalParticipants(createdRaw);

    const recipientId =
      conversation.user1Id === sessionUserId
        ? conversation.user2Id
        : conversation.user1Id;

    const preview =
      content.length > 60 ? `${content.slice(0, 60)}...` : content;

    await notificationModel.upsertMessageNotification({
      recipientId,
      conversationId: conversation.id,
      postId: conversation.postId || null,
      title: `${req.user.name} 님의 새 쪽지`,
      message: preview,
    });

    const [convForUser1, convForUser2] = await Promise.all([
      messageModel.findConversationById(conversation.id, conversation.user1Id),
      messageModel.findConversationById(conversation.id, conversation.user2Id),
    ]);

    emitToUser(conversation.user1Id, 'message:new', {
      conversation: convForUser1,
      chatMessage,
    });
    emitToUser(conversation.user2Id, 'message:new', {
      conversation: convForUser2,
      chatMessage,
    });
    emitToUser(recipientId, 'notification:updated', {
      conversationId: conversation.id,
    });

    const senderConversation =
      conversation.user1Id === sessionUserId ? convForUser1 : convForUser2;

    return res.status(201).json({
      message: '쪽지를 전송했습니다.',
      chatMessage,
      conversation: senderConversation,
    });
  },

  // 6. 보낸 쪽지 수정 (PATCH /api/messages/:id)
  async updateMessage(req, res) {
    const messageId = cleanText(req.params.id);
    if (!isIntegerId(messageId)) {
      return res.status(404).json({ message: '쪽지를 찾을 수 없습니다.' });
    }

    const content = cleanText(req.body?.content);
    if (!content) {
      return res
        .status(400)
        .json({ message: '수정할 쪽지 내용을 입력해 주세요.' });
    }
    if (content.length > 1000) {
      return res.status(400).json({
        message: '쪽지 내용은 1000자 이하로 입력해 주세요.',
      });
    }

    const sessionUserId = req.userId;
    const existing = await messageModel.findMessageById(messageId);
    if (!existing) {
      return res.status(404).json({ message: '쪽지를 찾을 수 없습니다.' });
    }

    if (existing.senderId !== sessionUserId) {
      return res
        .status(403)
        .json({ message: '본인이 보낸 쪽지만 수정할 수 있습니다.' });
    }

    if (existing.isDeleted) {
      return res
        .status(409)
        .json({ message: '삭제된 메시지는 수정할 수 없습니다.' });
    }

    if (existing.content === content) {
      return res
        .status(409)
        .json({ message: '기존 쪽지 내용과 동일합니다.' });
    }

    const updatedRaw = await messageModel.updateMessage(existing.id, content);
    const chatMessage = stripInternalParticipants(updatedRaw);

    const [convForUser1, convForUser2] = await Promise.all([
      messageModel.findConversationById(existing.conversationId, existing.user1Id),
      messageModel.findConversationById(existing.conversationId, existing.user2Id),
    ]);

    emitToUser(existing.user1Id, 'message:updated', {
      conversationId: existing.conversationId,
      conversation: convForUser1,
      chatMessage,
    });
    emitToUser(existing.user2Id, 'message:updated', {
      conversationId: existing.conversationId,
      conversation: convForUser2,
      chatMessage,
    });

    const senderConversation =
      existing.user1Id === sessionUserId ? convForUser1 : convForUser2;

    return res.status(200).json({
      message: '쪽지가 수정되었습니다.',
      chatMessage,
      conversation: senderConversation,
    });
  },

  // 7. 보낸 쪽지 삭제 (DELETE /api/messages/:id)
  async deleteMessage(req, res) {
    const messageId = cleanText(req.params.id);
    if (!isIntegerId(messageId)) {
      return res.status(404).json({ message: '쪽지를 찾을 수 없습니다.' });
    }

    const sessionUserId = req.userId;
    const existing = await messageModel.findMessageById(messageId);
    if (!existing) {
      return res.status(404).json({ message: '쪽지를 찾을 수 없습니다.' });
    }

    if (existing.senderId !== sessionUserId) {
      return res
        .status(403)
        .json({ message: '본인이 보낸 쪽지만 삭제할 수 있습니다.' });
    }

    if (existing.isDeleted) {
      return res
        .status(409)
        .json({ message: '이미 삭제된 메시지입니다.' });
    }

    const deletedRaw = await messageModel.removeMessageById(existing.id);
    const chatMessage = stripInternalParticipants(deletedRaw);

    const [convForUser1, convForUser2] = await Promise.all([
      messageModel.findConversationById(existing.conversationId, existing.user1Id),
      messageModel.findConversationById(existing.conversationId, existing.user2Id),
    ]);

    const recipientId =
      existing.user1Id === sessionUserId ? existing.user2Id : existing.user1Id;
    const recipientConversation =
      existing.user1Id === sessionUserId ? convForUser2 : convForUser1;

    let notificationCleared = false;
    if (
      !existing.isRead &&
      recipientConversation &&
      recipientConversation.unreadCount === 0
    ) {
      notificationCleared =
        await notificationModel.markMessageNotificationsAsReadByConversation(
          recipientId,
          existing.conversationId
        );
    }

    emitToUser(existing.user1Id, 'message:deleted', {
      conversationId: existing.conversationId,
      messageId: existing.id,
      chatMessage,
      conversation: convForUser1,
    });
    emitToUser(existing.user2Id, 'message:deleted', {
      conversationId: existing.conversationId,
      messageId: existing.id,
      chatMessage,
      conversation: convForUser2,
    });
    if (notificationCleared) {
      emitToUser(recipientId, 'notification:updated', {
        conversationId: existing.conversationId,
      });
    }

    const senderConversation =
      existing.user1Id === sessionUserId ? convForUser1 : convForUser2;

    return res.status(200).json({
      message: '쪽지가 삭제되었습니다.',
      deletedId: existing.id,
      chatMessage,
      conversationId: existing.conversationId,
      conversation: senderConversation,
    });
  },
};

module.exports = messageController;
