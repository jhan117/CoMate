const store = require('../store');

const notificationModel = {
  findByRecipientId(recipientId) {
    if (!recipientId) return [];
    return store.notifications
      .filter((n) => n.recipientId === String(recipientId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  countUnreadByRecipientId(recipientId) {
    if (!recipientId) return 0;
    return store.notifications.filter(
      (n) => n.recipientId === String(recipientId) && !n.isRead
    ).length;
  },

  findById(id) {
    return store.notifications.find((n) => n.id === String(id)) || null;
  },

  create({ recipientId, postId, applicationId = '', type, title, message }) {
    const newNotification = {
      id: `noti-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      recipientId: String(recipientId),
      postId: postId ? String(postId) : '',
      applicationId: applicationId ? String(applicationId) : '',
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    store.notifications.push(newNotification);
    return newNotification;
  },

  markAsRead(id) {
    const notification = this.findById(id);
    if (!notification) return null;
    notification.isRead = true;
    return notification;
  },

  markAllAsRead(recipientId) {
    const targetId = String(recipientId);
    store.notifications.forEach((n) => {
      if (n.recipientId === targetId) {
        n.isRead = true;
      }
    });
    return this.findByRecipientId(targetId);
  },

  removeById(id) {
    const index = store.notifications.findIndex((n) => n.id === String(id));
    if (index === -1) return false;
    store.notifications.splice(index, 1);
    return true;
  },
};

module.exports = notificationModel;
