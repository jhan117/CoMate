const applicationModel = require('../models/applicationModel');

async function requireAuth(req, res, next) {
  const sessionUserId = req.session?.user?.id;
  if (!sessionUserId || !/^\d+$/.test(String(sessionUserId))) {
    return res.status(401).json({ message: '로그인이 필요한 기능입니다.' });
  }

  const user = await applicationModel.findUserById(sessionUserId);
  if (!user) {
    return res
      .status(401)
      .json({ message: '유효하지 않은 세션입니다. 다시 로그인해 주세요.' });
  }

  req.user = user;
  req.userId = user.id;
  next();
}

module.exports = requireAuth;
