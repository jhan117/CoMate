const bcrypt = require('bcrypt');
const db = require('../db');

async function findByEmail(email) {
  const result = await db.query(
    `SELECT id, email, name, dept, password_hash AS "passwordHash"
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
}

async function findById(id) {
  if (
    !/^\d+$/.test(String(id)) ||
    Number(id) < 1 ||
    Number(id) > 2147483647
  ) {
    return null;
  }

  const result = await db.query(
    `SELECT id, email, name, dept, password_hash AS "passwordHash"
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

function publicUser({ id, email, name, dept }) {
  return { id: String(id), email, name, dept };
}

async function create({ email, name, dept, password }) {
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.query(
    `INSERT INTO users (email, name, dept, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, dept, password_hash AS "passwordHash"`,
    [email, name, dept, passwordHash]
  );

  return result.rows[0];
}

async function verifyPassword(user, password) {
  if (typeof user?.passwordHash !== 'string') {
    return false;
  }

  if (!user.passwordHash.startsWith('$2')) {
    return false;
  }

  return bcrypt.compare(password, user.passwordHash);
}

module.exports = { findByEmail, findById, publicUser, create, verifyPassword };