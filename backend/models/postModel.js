const db = require('../db');
const { isIntegerId } = require('../utils/validation');

async function list() {
  const result = await db.query(
    `SELECT
       p.id::text AS id,
       p.author_id::text AS "authorId",
       p.category,
       p.title,
       p.content,
       TO_CHAR(p.deadline, 'YYYY-MM-DD') AS deadline,
       p.created_at AS "createdAt",
       u.name AS author,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'deptName', d.dept_name,
               'currentMembers', d.current_members,
               'maxMembers', d.max_members
             )
             ORDER BY d.id
           )
           FROM post_departments d
           WHERE d.post_id = p.id
         ),
         '[]'::json
       ) AS departments
     FROM posts p
     JOIN users u ON u.id = p.author_id
     ORDER BY p.created_at DESC, p.id DESC`
  );

  return result.rows.map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}



async function find(id) {
  if (!isIntegerId(id)) {
    return null;
  }

  const result = await db.query(
    `SELECT
       p.id::text AS id,
       p.author_id::text AS "authorId",
       p.category,
       p.title,
       p.content,
       TO_CHAR(p.deadline, 'YYYY-MM-DD') AS deadline,
       p.created_at AS "createdAt",
       u.name AS author,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'deptName', d.dept_name,
               'currentMembers', d.current_members,
               'maxMembers', d.max_members
             )
             ORDER BY d.id
           )
           FROM post_departments d
           WHERE d.post_id = p.id
         ),
         '[]'::json
       ) AS departments
     FROM posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.id = $1`,
    [id]
  );

  const row = result.rows[0];

  return row ? {
    ...row,
    createdAt: new Date(row.createdAt).toISOString(),
  } : null;
}

async function create(fields, authorId) {
  const id = await db.withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO posts (author_id, category, title, content, deadline)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [authorId, fields.category, fields.title, fields.content, fields.deadline]
    );

    const id = result.rows[0].id;

    for (const dept of fields.departments) {
      await client.query(
        `INSERT INTO post_departments (post_id, dept_name, max_members)
         VALUES ($1, $2, $3)`,
        [id, dept.deptName, dept.maxMembers]
      );
    }

    return id;
  });

  return find(id);
}

async function update(post, fields) {
  try {
    const updated = await db.withTransaction(async (client) => {
      const lockedPost = await client.query(
        'SELECT id FROM posts WHERE id = $1 AND author_id = $2 FOR UPDATE',
        [post.id, post.authorId]
      );

      if (lockedPost.rowCount === 0) {
        return false;
      }

      const existing = await client.query(
        `SELECT d.dept_name, d.current_members,
                EXISTS (
                  SELECT 1 FROM applications a
                  WHERE a.post_id = d.post_id
                    AND a.target_dept = d.dept_name
                ) AS has_applications
         FROM post_departments d
         WHERE d.post_id = $1
         FOR UPDATE OF d`,
        [post.id]
      );

      const names = new Set(fields.departments.map((dept) => dept.deptName));

      for (const dept of existing.rows) {
        if (
          (!names.has(dept.dept_name) &&
            (dept.current_members > 0 || dept.has_applications)) ||
          (names.has(dept.dept_name) &&
            fields.departments.find((item) => item.deptName === dept.dept_name)
              .maxMembers < dept.current_members)
        ) {
          return false;
        }
      }

      await client.query(
        `UPDATE posts
        SET category = $1, title = $2, content = $3, deadline = $4
        WHERE id = $5 AND author_id = $6`,
        [fields.category, fields.title, fields.content, fields.deadline, post.id, post.authorId]
      );

      for (const dept of fields.departments) {
        await client.query(
          `INSERT INTO post_departments (post_id, dept_name, max_members)
           VALUES ($1, $2, $3)
           ON CONFLICT (post_id, dept_name)
           DO UPDATE SET max_members = EXCLUDED.max_members`,
          [post.id, dept.deptName, dept.maxMembers]
        );
      }

      await client.query(
        `DELETE FROM post_departments
         WHERE post_id = $1
           AND NOT (dept_name = ANY($2::text[]))`,
        [post.id, [...names]]
      );

      return true;
    });

    return updated ? find(post.id) : null;
  } catch (error) {
    if (error.code === '23503') {
      return null;
    }

    throw error;
  }
}

async function remove(post) {
  try {
    return await db.withTransaction(async (client) => {

    const lockedPost = await client.query(
      'SELECT id FROM posts WHERE id = $1 AND author_id = $2 FOR UPDATE',
      [post.id, post.authorId]
    );

    if (lockedPost.rowCount === 0) {
      return 'not_found';
    }


      const applications = await client.query(
        'SELECT id FROM applications WHERE post_id = $1 LIMIT 1',
        [post.id]
      );

      if (applications.rows.length > 0) {
        return 'conflict';
      }

    const result = await client.query(
      'DELETE FROM posts WHERE id = $1 AND author_id = $2',
      [post.id, post.authorId]
    );

      return result.rowCount > 0 ? 'deleted' : 'not_found';
    });
  } catch (error) {
    if (error.code === '23503') {
      return 'conflict';
    }

    throw error;
  }
}

module.exports = { list, find, create, update, remove };