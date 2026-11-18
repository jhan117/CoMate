const db = require('../db');

function mapNotificationRow(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    recipientId: String(row.recipient_id),
    postId: row.post_id ? String(row.post_id) : '',
    applicationId: row.application_id ? String(row.application_id) : '',
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

const notificationModel = {
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
    type,
    title,
    message,
  }) {
    const { rows } = await db.query(
      `INSERT INTO notifications (
         recipient_id, post_id, application_id, type, title, message, is_read
       )
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       RETURNING *`,
      [recipientId, postId || null, applicationId || null, type, title, message]
    );
    return mapNotificationRow(rows[0]);
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

  async markAllAsRead(recipientId) {
    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE recipient_id = $1 AND is_read = FALSE`,
      [recipientId]
    );
    return this.findByRecipientId(recipientId);
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
