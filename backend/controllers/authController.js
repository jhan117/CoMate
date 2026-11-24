const users = require('../models/userModel');

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function startSession(req, res, next, user, status) {
  req.session.regenerate((error) => {
    if (error) return next(error);

    req.session.user = { id: String(user.id) };

    req.session.save((error) => {
      if (error) return next(error);

      return res.status(status).json({ user: users.publicUser(user) });
    });
  });
}


async function signup(req, res, next) {
  const email = text(req.body?.email).toLowerCase();
  const name = text(req.body?.name);
  const dept = text(req.body?.dept);
  const password = req.body?.password;

  if (
    typeof req.body?.email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    !name || name.length > 50 ||
    !dept || dept.length > 100 ||
    typeof password !== 'string' ||
    password.length < 8 || password.length > 128
  ) {
    return res.status(400).json({
      message: '올바른 이메일, 이름, 학과, 비밀번호 8~128자를 입력해 주세요.',
    });
  }

  try {
    if (await users.findByEmail(email)) {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }

    const user = await users.create({ email, name, dept, password });

    startSession(req, res, next, user, 201);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }

    next(error);
  }
}



async function login(req, res, next) {
  const email = text(req.body?.email).toLowerCase();
  const password = req.body?.password;

  if (
    typeof req.body?.email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    typeof password !== 'string' ||
    !password || password.length > 128
  ) {
    return res.status(400).json({ message: '올바른 이메일과 비밀번호를 입력해 주세요.' });
  }

  try {
    const user = await users.findByEmail(email);

    if (!user || !(await users.verifyPassword(user, password))) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    startSession(req, res, next, user, 200);
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  return res.json({ user: users.publicUser(req.user) });
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie('comate.sid', {
      path: '/',
      httpOnly: true,
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',
      secure: process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER),
    });
    return res.status(204).end();
  });
}

module.exports = { signup, login, me, logout };