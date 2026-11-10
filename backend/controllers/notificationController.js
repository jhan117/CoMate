const notificationModel = require('../models/notificationModel');

const notificationController = {
  // 1. 특정 사용자의 알림 목록 및 안 읽은 개수 조회 (GET /api/notifications?userId=...)
  getNotificationsByUser(req, res) {
    const userId = req.query.userId || req.session?.user?.id;
    if (!userId) {
      return res.status(400).json({ message: 'userId 파라미터가 필요합니다.' });
    }

    const notifications = notificationModel.findByRecipientId(userId);
    const unreadCount = notificationModel.countUnreadByRecipientId(userId);

    return res.json({
      notifications,
      unreadCount,
    });
  },

  // 2. 단건 알림 읽음 처리 (PATCH /api/notifications/:id/read)
  markNotificationAsRead(req, res) {
    const notification = notificationModel.markAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }

    const unreadCount = notificationModel.countUnreadByRecipientId(
      notification.recipientId
    );

    return res.json({
      message: '알림을 읽음 처리했습니다.',
      notification,
      unreadCount,
    });
  },

  // 3. 사용자의 모든 알림 읽음 처리 (PATCH /api/notifications/read-all)
  markAllNotificationsAsRead(req, res) {
    const userId = req.body?.userId || req.session?.user?.id;
    if (!userId) {
      return res.status(400).json({ message: 'userId가 필요합니다.' });
    }

    const notifications = notificationModel.markAllAsRead(userId);
    return res.json({
      message: '모든 알림을 읽음 처리했습니다.',
      notifications,
      unreadCount: 0,
    });
  },

  // 4. 단건 알림 삭제 (DELETE /api/notifications/:id)
  deleteNotification(req, res) {
    const target = notificationModel.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }

    const recipientId = target.recipientId;
    notificationModel.removeById(target.id);
    const unreadCount = notificationModel.countUnreadByRecipientId(recipientId);

    return res.json({
      message: '알림이 삭제되었습니다.',
      unreadCount,
    });
  },
};

module.exports = notificationController;
