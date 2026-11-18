const notificationModel = require('../models/notificationModel');

function isIntegerId(value) {
  return /^\d+$/.test(String(value || '').trim());
}

const notificationController = {
  // 1. 로그인한 사용자의 알림 목록 및 안 읽은 개수 조회 (GET /api/notifications)
  async getNotificationsByUser(req, res) {
    const userId = req.userId;

    const [notifications, unreadCount] = await Promise.all([
      notificationModel.findByRecipientId(userId),
      notificationModel.countUnreadByRecipientId(userId),
    ]);

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  },

  // 2. 단건 알림 읽음 처리 (PATCH /api/notifications/:id/read)
  async markNotificationAsRead(req, res) {
    if (!isIntegerId(req.params.id)) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }
    const userId = req.userId;
    const target = await notificationModel.findById(req.params.id);

    if (!target) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }

    if (target.recipientId !== userId) {
      return res
        .status(403)
        .json({ message: '본인의 알림만 읽음 처리할 수 있습니다.' });
    }

    const [notification, unreadCount] = await Promise.all([
      notificationModel.markAsRead(target.id),
      notificationModel.countUnreadByRecipientId(userId),
    ]);

    return res.status(200).json({
      message: '알림을 읽음 처리했습니다.',
      notification,
      unreadCount,
    });
  },

  // 3. 로그인한 사용자의 알림 읽음 처리 (PATCH /api/notifications/read-all?filter=...)
  async markAllNotificationsAsRead(req, res) {
    const userId = req.userId;
    const filter = String(req.query.filter || req.body?.filter || 'all').trim();

    if (!notificationModel.VALID_NOTIFICATION_FILTERS.includes(filter)) {
      return res.status(400).json({ message: '유효하지 않은 알림 필터입니다.' });
    }

    const [notifications, unreadCount] = await Promise.all([
      notificationModel.markAllAsRead(userId, filter),
      notificationModel.countUnreadByRecipientId(userId),
    ]);

    return res.status(200).json({
      message: '선택한 알림을 모두 읽음 처리했습니다.',
      notifications,
      unreadCount,
    });
  },

  // 4. 로그인한 사용자의 알림 일괄 삭제 (DELETE /api/notifications?filter=...)
  async deleteAllNotifications(req, res) {
    const userId = req.userId;
    const filter = String(req.query.filter || 'all').trim();

    if (!notificationModel.VALID_NOTIFICATION_FILTERS.includes(filter)) {
      return res.status(400).json({ message: '유효하지 않은 알림 필터입니다.' });
    }

    const result = await notificationModel.removeAllByRecipient(userId, filter);
    const unreadCount = await notificationModel.countUnreadByRecipientId(userId);

    return res.status(200).json({
      message: '선택한 알림을 모두 삭제했습니다.',
      deletedCount: result.deletedCount,
      notifications: result.notifications,
      unreadCount,
    });
  },

  // 5. 단건 알림 삭제 (DELETE /api/notifications/:id)
  async deleteNotification(req, res) {
    if (!isIntegerId(req.params.id)) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }
    const userId = req.userId;
    const target = await notificationModel.findById(req.params.id);

    if (!target) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }

    if (target.recipientId !== userId) {
      return res
        .status(403)
        .json({ message: '본인의 알림만 삭제할 수 있습니다.' });
    }

    await notificationModel.removeById(target.id);
    const unreadCount = await notificationModel.countUnreadByRecipientId(userId);

    return res.status(200).json({
      message: '알림이 삭제되었습니다.',
      unreadCount,
    });
  },
};

module.exports = notificationController;
