const { randomUUID, randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const store = require('../store');

const deriveKey = promisify(scrypt);

function findByStudentId(studentId) {
  return store.users.find((user) => user.studentId === studentId);
}

function findById(id) {
  return store.users.find((user) => user.id === id);
}

function publicUser({ id, studentId, name, dept }) {
  return { id, studentId, name, dept };
}

async function create({ studentId, name, dept, password }) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64);

  if (findByStudentId(studentId)) return null;

  const user = {
    id: randomUUID(),
    studentId,
    name,
    dept,
    passwordSalt: salt,
    passwordHash: key.toString('hex'),
  };

  store.users.push(user);
  return user;
}

async function verifyPassword(user, password) {
  if (!user.passwordHash || !user.passwordSalt) {
    return process.env.NODE_ENV !== 'production' &&
      !process.env.RENDER &&
      typeof user.password === 'string' &&
      user.password === password;
    }

  const expected = Buffer.from(user.passwordHash, 'hex');
  const actual = await deriveKey(password, user.passwordSalt, expected.length);

  return timingSafeEqual(expected, actual);
}

module.exports = { findByStudentId, findById, publicUser, create, verifyPassword };