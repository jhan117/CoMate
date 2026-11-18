const db = require('../db');

function mapMessageRow(row) {
  if (!row) return null;
  const isDeleted = Boolean(row.deleted_at);
  const hasUpdated = Boolean(row.updated_at) && !isDeleted;

  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    senderId: String(row.sender_id),
    senderName: row.sender_name || '알 수 없음',
    senderStudentId: row.sender_student_id || '',
    senderDept: row.sender_dept || '',
    content: isDeleted ? '삭제된 메시지입니다.' : row.content,
    isRead: Boolean(row.is_read),
    isEdited: hasUpdated,
    isDeleted,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
    ...(row.user1_id !== undefined
      ? {
          user1Id: String(row.user1_id),
          user2Id: String(row.user2_id),
        }
      : {}),
  };
}

function mapConversationRow(row, viewerUserId) {
  if (!row) return null;

  const viewerIdStr = String(viewerUserId || '');
  const isUser1 = String(row.user1_id) === viewerIdStr;

  const partner = isUser1
    ? {
        id: String(row.user2_id),
        studentId: row.user2_student_id || '',
        name: row.user2_name || '알 수 없음',
        dept: row.user2_dept || '',
      }
    : {
        id: String(row.user1_id),
        studentId: row.user1_student_id || '',
        name: row.user1_name || '알 수 없음',
        dept: row.user1_dept || '',
      };

  const post = row.post_id
    ? {
        id: String(row.post_id),
        title: row.post_title || '',
        category: row.post_category || '',
      }
    : null;

  const lastMessage = row.last_message_id
    ? {
        id: String(row.last_message_id),
        senderId: String(row.last_message_sender_id),
        senderName: row.last_message_sender_name || '알 수 없음',
        content: row.last_message_deleted_at
          ? '삭제된 메시지입니다.'
          : row.last_message_content || '',
        isRead: Boolean(row.last_message_is_read),
        isEdited:
          Boolean(row.last_message_updated_at) &&
          !row.last_message_deleted_at,
        isDeleted: Boolean(row.last_message_deleted_at),
        createdAt: row.last_message_created_at
          ? new Date(row.last_message_created_at).toISOString()
          : null,
        updatedAt: row.last_message_updated_at
          ? new Date(row.last_message_updated_at).toISOString()
          : null,
      }
    : null;

  return {
    id: String(row.id),
    user1Id: String(row.user1_id),
    user2Id: String(row.user2_id),
    postId: row.post_id ? String(row.post_id) : '',
    post,
    partner,
    lastMessage,
    unreadCount: Number(row.unread_count ?? 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

// $1 = viewerUserId (안 읽은 메시지 개수 계산용)
const BASE_CONVERSATION_SELECT = `
  SELECT
    c.*,
    u1.student_id AS user1_student_id,
    u1.name AS user1_name,
    u1.dept AS user1_dept,
    u2.student_id AS user2_student_id,
    u2.name AS user2_name,
    u2.dept AS user2_dept,
    p.title AS post_title,
    p.category AS post_category,
    lm.id AS last_message_id,
    lm.sender_id AS last_message_sender_id,
    lm.sender_name AS last_message_sender_name,
    lm.content AS last_message_content,
    lm.is_read AS last_message_is_read,
    lm.created_at AS last_message_created_at,
    lm.updated_at AS last_message_updated_at,
    lm.deleted_at AS last_message_deleted_at,
    (
      SELECT COUNT(*)::int
      FROM messages um
      WHERE um.conversation_id = c.id
        AND um.sender_id <> $1
        AND um.is_read = FALSE
        AND um.deleted_at IS NULL
    ) AS unread_count
  FROM conversations c
  JOIN users u1 ON u1.id = c.user1_id
  JOIN users u2 ON u2.id = c.user2_id
  LEFT JOIN posts p ON p.id = c.post_id
  LEFT JOIN LATERAL (
    SELECT
      m.id,
      m.sender_id,
      su.name AS sender_name,
      m.content,
      m.is_read,
      m.created_at,
      m.updated_at,
      m.deleted_at
    FROM messages m
    JOIN users su ON su.id = m.sender_id
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1
  ) lm ON TRUE
`;

const messageModel = {
  async findUserById(userId) {
    const { rows } = await db.query(
      `SELECT id::text AS id, student_id AS "studentId", name, dept
       FROM users
       WHERE id = $1`,
      [userId]
    );
    return rows[0] || null;
  },

  async findPostBriefById(postId) {
    const { rows } = await db.query(
      `SELECT id::text AS id, title, category
       FROM posts
       WHERE id = $1`,
      [postId]
    );
    return rows[0] || null;
  },

  async findConversationsByUserId(userId) {
    const { rows } = await db.query(
      `${BASE_CONVERSATION_SELECT}
       WHERE c.user1_id = $1 OR c.user2_id = $1
       ORDER BY c.updated_at DESC, c.id DESC`,
      [userId]
    );
    return rows.map((row) => mapConversationRow(row, userId));
  },

  async findConversationById(conversationId, viewerUserId) {
    const { rows } = await db.query(
      `${BASE_CONVERSATION_SELECT}
       WHERE c.id = $2`,
      [viewerUserId, conversationId]
    );
    if (!rows[0]) return null;
    return mapConversationRow(rows[0], viewerUserId || rows[0].user1_id);
  },

  async findOrCreateConversation({ userAId, userBId, postId = null }) {
    const numA = Number(userAId);
    const numB = Number(userBId);
    const [user1Id, user2Id] = numA < numB ? [numA, numB] : [numB, numA];

    const existingRes = await db.query(
      `SELECT id, post_id
       FROM conversations
       WHERE user1_id = $1 AND user2_id = $2`,
      [user1Id, user2Id]
    );

    if (existingRes.rows[0]) {
      const existing = existingRes.rows[0];
      if (postId && String(existing.post_id || '') !== String(postId)) {
        await db.query(
          `UPDATE conversations
           SET post_id = $1
           WHERE id = $2`,
          [postId, existing.id]
        );
      }
      const conversation = await this.findConversationById(existing.id, userAId);
      return { conversation, created: false };
    }

    const insertRes = await db.query(
      `INSERT INTO conversations (user1_id, user2_id, post_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user1_id, user2_id)
       DO UPDATE SET post_id = COALESCE(EXCLUDED.post_id, conversations.post_id)
       RETURNING id, (xmax = 0) AS created`,
      [user1Id, user2Id, postId || null]
    );

    const row = insertRes.rows[0];
    const conversation = await this.findConversationById(row.id, userAId);
    return { conversation, created: Boolean(row.created) };
  },

  async findMessagesByConversationId(conversationId) {
    const { rows } = await db.query(
      `SELECT
         m.*,
         u.name AS sender_name,
         u.student_id AS sender_student_id,
         u.dept AS sender_dept
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC, m.id ASC`,
      [conversationId]
    );
    return rows.map(mapMessageRow);
  },

  async findMessageById(messageId) {
    const { rows } = await db.query(
      `SELECT
         m.*,
         u.name AS sender_name,
         u.student_id AS sender_student_id,
         u.dept AS sender_dept,
         c.user1_id,
         c.user2_id
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       JOIN conversations c ON c.id = m.conversation_id
       WHERE m.id = $1`,
      [messageId]
    );
    return mapMessageRow(rows[0]);
  },

  async createMessage({ conversationId, senderId, content }) {
    const newId = await db.withTransaction(async (client) => {
      const insertRes = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, content, is_read)
         VALUES ($1, $2, $3, FALSE)
         RETURNING id`,
        [conversationId, senderId, String(content).trim()]
      );

      await client.query(
        `UPDATE conversations
         SET updated_at = NOW()
         WHERE id = $1`,
        [conversationId]
      );

      return insertRes.rows[0].id;
    });

    return this.findMessageById(newId);
  },

  async markConversationMessagesAsRead(conversationId, readerUserId) {
    const { rows } = await db.query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE conversation_id = $1
         AND sender_id <> $2
         AND is_read = FALSE
       RETURNING id`,
      [conversationId, readerUserId]
    );

    return rows.map((row) => String(row.id));
  },

  async updateMessage(messageId, content) {
    const { rows } = await db.query(
      `UPDATE messages
       SET content = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id`,
      [String(content).trim(), messageId]
    );

    if (!rows[0]) return null;
    return this.findMessageById(rows[0].id);
  },

  async removeMessageById(messageId) {
    const { rows } = await db.query(
      `UPDATE messages
       SET content = '삭제된 메시지입니다.',
           is_read = TRUE,
           deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [messageId]
    );
    if (!rows[0]) return null;
    return this.findMessageById(rows[0].id);
  },
};

module.exports = messageModel;
