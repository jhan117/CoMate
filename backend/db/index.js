const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL 환경 변수를 설정해 주세요.');
}

const isLocalDb = /(localhost|127\.0\.0\.1)/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

function query(text, params = []) {
  return pool.query(text, params);
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schemaSql);
}

module.exports = {
  pool,
  query,
  withTransaction,
  initDatabase,
};
