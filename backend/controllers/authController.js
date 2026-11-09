const users = require('../models/userModel');

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function startSession(req, res, next, user, status) {
  req.session.regenerate((error) => {
    if (error) return next(error);

    req.session.user = { id: user.id };

    req.session.save((error) => {
      if (error) return next(error);

      return res.status(status).json({ user: users.publicUser(user) });
    });
  });
}

async function signup(req, res, next) {
  const studentId = text(req.body?.studentId);
  const name = text(req.body?.name);
  const dept = text(req.body?.dept);
  const password = req.body?.password;

  if (
    !/^\d{8}$/.test(studentId) ||
    !name || name.length > 50 ||
    !dept || dept.length > 100 ||
    typeof password !== 'string' ||
    password.length < 8 || password.length > 128
  ) {
    return res.status(400).json({
      message: '학번 8자리, 이름, 학과, 비밀번호 8~128자를 입력해 주세요.',
    });
  }

  if (users.findByStudentId(studentId)) {
    return res.status(409).json({ message: '이미 가입된 학번입니다.' });
  }

  try {
    const user = await users.create({ studentId, name, dept, password });

    if (!user) {
      return res.status(409).json({ message: '이미 가입된 학번입니다.' });
    }

    startSession(req, res, next, user, 201);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  const studentId = text(req.body?.studentId);
  const password = req.body?.password;

  if (!studentId || typeof password !== 'string' || !password || password.length > 128) {
    return res.status(400).json({ message: '학번과 비밀번호를 입력해 주세요.' });
  }

  try {
    const user = users.findByStudentId(studentId);

    if (!user || !(await users.verifyPassword(user, password))) {
      return res.status(401).json({ message: '학번 또는 비밀번호가 올바르지 않습니다.' });
    }

    startSession(req, res, next, user, 200);
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  const user = users.findById(req.session.user?.id);

  return res.json({ user: user ? users.publicUser(user) : null });
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie('comate.sid', { path: '/' });
    return res.status(204).end();
  });
}

module.exports = { signup, login, me, logout };