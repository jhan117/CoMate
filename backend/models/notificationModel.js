const db = require('../db');

function mapNotificationRow(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    recipientId: String(row.recipient_id),
    postId: row.post_id ? String(row.post_id) : '',
    applicationId: row.application_id ? String(row.application_id) : '',
    conversationId: row.conversation_id ? String(row.conversation_id) : '',
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

const VALID_NOTIFICATION_FILTERS = ['all', 'unread', 'recruitment', 'message'];

function getFilterSqlClause(filter = 'all') {
  switch (filter) {
    case 'all':
      return '';
    case 'unread':
      return ' AND is_read = FALSE';
    case 'recruitment':
      return " AND type <> 'message_new'";
    case 'message':
      return " AND type = 'message_new'";
    default:
      return null;
  }
}

const notificationModel = {
  VALID_NOTIFICATION_FILTERS,
  async findByRecipientId(recipientId) {
    const { rows } = await db.query(
      `SELECT *
       FROM notifications
       WHERE recipient_id = $1
       ORDER BY created_at DESC`,
      [recipientId]
    );
    return rows.map(mapNotificationRow);
  },

  async countUnreadByRecipientId(recipientId) {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE recipient_id = $1 AND is_read = FALSE`,
      [recipientId]
    );
    return rows[0]?.count ?? 0;
  },

  async findById(id) {
    const { rows } = await db.query(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );
    return mapNotificationRow(rows[0]);
  },

  async create({
    recipientId,
    postId = null,
    applicationId = null,
    conversationId = null,
    type,
    title,
    message,
  }) {
    const { rows } = await db.query(
      `INSERT INTO notifications (
         recipient_id, post_id, application_id, conversation_id, type, title, message, is_read
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING *`,
      [
        recipientId,
        postId || null,
        applicationId || null,
        conversationId || null,
        type,
        title,
        message,
      ]
    );
    return mapNotificationRow(rows[0]);
  },

  async upsertMessageNotification({
    recipientId,
    conversationId,
    postId = null,
    title,
    message,
  }) {
    const existingRes = await db.query(
      `SELECT id
       FROM notifications
       WHERE recipient_id = $1
         AND conversation_id = $2
         AND type = 'message_new'
         AND is_read = FALSE
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [recipientId, conversationId]
    );

    if (existingRes.rows[0]) {
      const { rows } = await db.query(
        `UPDATE notifications
         SET title = $1,
             message = $2,
             post_id = COALESCE($3, post_id),
             created_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [title, message, postId || null, existingRes.rows[0].id]
      );
      return mapNotificationRow(rows[0]);
    }

    return this.create({
      recipientId,
      postId,
      conversationId,
      type: 'message_new',
      title,
      message,
    });
  },

  async markMessageNotificationsAsReadByConversation(recipientId, conversationId) {
    const { rowCount } = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE recipient_id = $1
         AND conversation_id = $2
         AND type = 'message_new'
         AND is_read = FALSE`,
      [recipientId, conversationId]
    );
    return rowCount > 0;
  },

  async markAsRead(id) {
    const { rows } = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return mapNotificationRow(rows[0]);
  },

  async markAllAsRead(recipientId, filter = 'all') {
    const clause = getFilterSqlClause(filter);
    if (clause === null) return null;

    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE recipient_id = $1 AND is_read = FALSE${clause}`,
      [recipientId]
    );
    return this.findByRecipientId(recipientId);
  },

  async removeAllByRecipient(recipientId, filter = 'all') {
    const clause = getFilterSqlClause(filter);
    if (clause === null) return null;

    const { rowCount } = await db.query(
      `DELETE FROM notifications
       WHERE recipient_id = $1${clause}`,
      [recipientId]
    );

    const notifications = await this.findByRecipientId(recipientId);
    return {
      deletedCount: rowCount,
      notifications,
    };
  },

  async removeById(id) {
    const { rowCount } = await db.query(
      'DELETE FROM notifications WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  },
};

module.exports = notificationModel;
