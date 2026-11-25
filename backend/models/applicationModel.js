const db = require('../db');

function mapApplicationRow(row) {
  if (!row) return null;
  const hasUpdated = Boolean(row.updated_at);
  const isPendingResubmitted = row.status === 'pending' && hasUpdated;

  return {
    id: String(row.id),
    postId: String(row.post_id),
    applicantId: String(row.applicant_id),
    targetDept: row.target_dept,
    message: row.message,
    status: row.status,
    feedback: isPendingResubmitted ? '' : row.feedback || '',
    previousFeedback: isPendingResubmitted ? row.feedback || '' : '',
    isResubmitted: hasUpdated,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    processedAt: row.processed_at
      ? new Date(row.processed_at).toISOString()
      : null,
    applicantEmail: row.applicant_email || '',
    applicantName: row.applicant_name || '알 수 없음',
    applicantDept: row.applicant_dept || '',
    ...(row.post_title !== undefined
      ? {
        postTitle: row.post_title,
        postCategory: row.post_category,
        postDeadline: row.post_deadline,
      }
      : {}),
  };
}

const BASE_APPLICATION_SELECT = `
  SELECT
    a.*,
    u.email AS applicant_email,
    u.name AS applicant_name,
    u.dept AS applicant_dept
  FROM applications a
  JOIN users u ON u.id = a.applicant_id
`;

const applicationModel = {
  async findUserById(userId) {
    const { rows } = await db.query(
      `SELECT id::text AS id, email, name, dept
       FROM users
       WHERE id = $1`,
      [userId]
    );
    return rows[0] || null;
  },

  async findPostById(postId) {
    const postResult = await db.query(
      `SELECT
         p.id::text AS id,
         p.category,
         p.title,
         p.content,
         p.author_id::text AS "authorId",
         p.created_at AS "createdAt",
         TO_CHAR(p.deadline, 'YYYY-MM-DD') AS deadline,
         u.name AS author,
         (SELECT COUNT(*)::int FROM applications a WHERE a.post_id = p.id) AS "totalApplicants"
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.id = $1`,
      [postId]
    );

    const post = postResult.rows[0];
    if (!post) return null;

    const deptResult = await db.query(
      `SELECT
         pd.dept_name AS "deptName",
         pd.current_members AS "currentMembers",
         pd.max_members AS "maxMembers",
         COUNT(a.id)::int AS "applicantCount"
       FROM post_departments pd
       LEFT JOIN applications a
         ON a.post_id = pd.post_id AND a.target_dept = pd.dept_name
       WHERE pd.post_id = $1
       GROUP BY pd.id, pd.dept_name, pd.current_members, pd.max_members
       ORDER BY pd.id ASC`,
      [postId]
    );

    return {
      ...post,
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      departments: deptResult.rows,
    };
  },

  async findByPostId(postId) {
    const { rows } = await db.query(
      `${BASE_APPLICATION_SELECT}
       WHERE a.post_id = $1
       ORDER BY a.created_at DESC`,
      [postId]
    );

    return rows.map(mapApplicationRow);
  },

  async findById(id) {
    const { rows } = await db.query(
      `${BASE_APPLICATION_SELECT}
       WHERE a.id = $1`,
      [id]
    );

    return mapApplicationRow(rows[0]);
  },

  async findByPostAndApplicant(postId, applicantId) {
    const { rows } = await db.query(
      `${BASE_APPLICATION_SELECT}
       WHERE a.post_id = $1 AND a.applicant_id = $2`,
      [postId, applicantId]
    );

    return mapApplicationRow(rows[0]);
  },

  async findPostsByAuthorId(authorId) {
    const { rows } = await db.query(
      `SELECT
         p.id::text AS id,
         p.category,
         p.title,
         p.content,
         p.author_id::text AS "authorId",
         p.created_at AS "createdAt",
         TO_CHAR(p.deadline, 'YYYY-MM-DD') AS deadline,
         u.name AS author,
         COUNT(a.id)::int AS "totalApplicants",
         COUNT(a.id) FILTER (WHERE a.status = 'pending')::int AS "pendingCount",
         COUNT(a.id) FILTER (WHERE a.status = 'revision_requested')::int AS "revisionCount",
         COUNT(a.id) FILTER (WHERE a.status = 'approved')::int AS "approvedCount"
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN applications a ON a.post_id = p.id
       WHERE p.author_id = $1
       GROUP BY p.id, u.name
       ORDER BY p.created_at DESC`,
      [authorId]
    );

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    }));
  },

  async findByApplicantId(applicantId) {
    const { rows } = await db.query(
      `SELECT
         a.*,
         u.email AS applicant_email,
         u.name AS applicant_name,
         u.dept AS applicant_dept,
         p.title AS post_title,
         p.category AS post_category,
         TO_CHAR(p.deadline, 'YYYY-MM-DD') AS post_deadline
       FROM applications a
       JOIN users u ON u.id = a.applicant_id
       JOIN posts p ON p.id = a.post_id
       WHERE a.applicant_id = $1
       ORDER BY a.created_at DESC`,
      [applicantId]
    );

    return rows.map(mapApplicationRow);
  },

  async create({ postId, user, targetDept, message }) {
    const { rows } = await db.query(
      `INSERT INTO applications (post_id, applicant_id, target_dept, message, status, feedback)
       VALUES ($1, $2, $3, $4, 'pending', '')
       RETURNING id`,
      [postId, user.id, targetDept, String(message).trim()]
    );

    return this.findById(rows[0].id);
  },

  async resubmit(id, { targetDept, message }) {
    const { rows } = await db.query(
      `UPDATE applications
       SET target_dept = $1,
           message = $2,
           status = 'pending',
           updated_at = NOW()
       WHERE id = $3
       RETURNING id`,
      [targetDept, String(message).trim(), id]
    );

    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  },

  async updateStatus(id, { status, feedback = '' }) {
    const { rows } = await db.query(
      `UPDATE applications
       SET status = $1,
           feedback = $2,
           processed_at = NOW()
       WHERE id = $3
       RETURNING id`,
      [status, String(feedback).trim(), id]
    );

    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  },

  async approveApplication(applicationId, postId) {
    const txResult = await db.withTransaction(async (client) => {
      // 지원서 행에 락을 걸어서 최신 상태 다시 확인
      const appRes = await client.query(
        `SELECT id, post_id, target_dept, status
        FROM applications
        WHERE id = $1 AND post_id = $2
        FOR UPDATE`,
        [applicationId, postId]
      );

      const app = appRes.rows[0];
      if (!app) return { error: 'APP_NOT_FOUND' };

      if (app.status === 'approved' || app.status === 'rejected')
        return { error: 'ALREADY_PROCESSED', status: app.status };

      // 모집 부문 행에 락 걸어서 정원 확인
      const deptRes = await client.query(
        `SELECT id, dept_name AS "deptName", current_members AS "currentMembers", max_members AS "maxMembers"
        FROM post_departments
        WHERE post_id = $1 AND dept_name = $2
        FOR UPDATE`,
        [postId, app.target_dept]
      );

      const dept = deptRes.rows[0];
      if (!dept) return { error: 'DEPT_NOT_FOUND' };

      if (dept.currentMembers >= dept.maxMembers)
        return { error: 'DEPT_FULL', dept };

      // 정원 +1
      const updatedDeptRes = await client.query(
        `UPDATE post_departments
         SET current_members = current_members + 1
         WHERE id = $1
         RETURNING dept_name AS "deptName", current_members AS "currentMembers", max_members AS "maxMembers"`,
        [dept.id]
      );

      // 같은 트랜잭션 내에서 지원서 상태 approved로 확정
      await client.query(
        `UPDATE applications
         SET status = 'approved',
             feedback = '',
             processed_at = NOW()
         WHERE id = $1`,
        [app.id]
      );

      return { dept: updatedDeptRes.rows[0] };
    });

    if (txResult.error) return txResult;

    const application = await this.findById(applicationId);
    return { dept: txResult.dept, application };
  },

  async autoRejectPendingByDept(
    postId,
    deptName,
    excludeApplicationId,
    feedback
  ) {
    const { rows } = await db.query(
      `UPDATE applications a
       SET status = 'rejected',
           feedback = $1,
           processed_at = NOW()
       FROM users u
       WHERE a.applicant_id = u.id
         AND a.post_id = $2
         AND a.target_dept = $3
         AND a.id <> $4
         AND a.status IN ('pending', 'revision_requested')
       RETURNING
         a.*,
         u.email AS applicant_email,
         u.name AS applicant_name,
         u.dept AS applicant_dept`,
      [String(feedback).trim(), postId, deptName, excludeApplicationId]
    );

    return rows.map(mapApplicationRow);
  },

  async removeById(id) {
    const { rowCount } = await db.query(
      `DELETE FROM applications
      WHERE id = $1
        AND status IN ('pending', 'revision_requested')`,
      [id]
    );
    return rowCount > 0;
  },
};

module.exports = applicationModel;
