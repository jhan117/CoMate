const notificationModel = require('../models/notificationModel');

const notificationController = {
  // 1. 로그인한 사용자의 알림 목록 및 안 읽은 개수 조회 (GET /api/notifications)
  getNotificationsByUser(req, res) {
    try {
      // R10: userId는 브라우저(req.query)에서 받지 않고 세션(req.userId)만 사용
      const userId = req.userId;

      const notifications = notificationModel.findByRecipientId(userId);
      const unreadCount = notificationModel.countUnreadByRecipientId(userId);

      return res.status(200).json({
        notifications,
        unreadCount,
      });
    } catch (error) {
      console.error('알림 조회 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },

  // 2. 단건 알림 읽음 처리 (PATCH /api/notifications/:id/read)
  markNotificationAsRead(req, res) {
    try {
      const userId = req.userId;
      const target = notificationModel.findById(req.params.id);

      if (!target) {
        return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
      }

      if (target.recipientId !== userId) {
        return res.status(403).json({ message: '본인의 알림만 읽음 처리할 수 있습니다.' });
      }

      const notification = notificationModel.markAsRead(target.id);
      const unreadCount = notificationModel.countUnreadByRecipientId(userId);

      return res.status(200).json({
        message: '알림을 읽음 처리했습니다.',
        notification,
        unreadCount,
      });
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },

  // 3. 로그인한 사용자의 모든 알림 읽음 처리 (PATCH /api/notifications/read-all)
  markAllNotificationsAsRead(req, res) {
    try {
      // R10: userId는 브라우저(req.body)에서 받지 않고 세션(req.userId)만 사용
      const userId = req.userId;

      const notifications = notificationModel.markAllAsRead(userId);
      return res.status(200).json({
        message: '모든 알림을 읽음 처리했습니다.',
        notifications,
        unreadCount: 0,
      });
    } catch (error) {
      console.error('전체 알림 읽음 처리 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },

  // 4. 단건 알림 삭제 (DELETE /api/notifications/:id)
  deleteNotification(req, res) {
    try {
      const userId = req.userId;
      const target = notificationModel.findById(req.params.id);

      if (!target) {
        return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
      }

      if (target.recipientId !== userId) {
        return res.status(403).json({ message: '본인의 알림만 삭제할 수 있습니다.' });
      }

      notificationModel.removeById(target.id);
      const unreadCount = notificationModel.countUnreadByRecipientId(userId);

      return res.status(200).json({
        message: '알림이 삭제되었습니다.',
        unreadCount,
      });
    } catch (error) {
      console.error('알림 삭제 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },
};

module.exports = notificationController;
