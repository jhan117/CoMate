const userModel = require('../models/userModel');

async function requireAuth(req, res, next) {
  const sessionUserId = req.session?.user?.id;
  if (!sessionUserId || !/^\d+$/.test(String(sessionUserId))) {
    return res.status(401).json({ message: '로그인이 필요한 기능입니다.' });
  }

  const user = await userModel.findById(sessionUserId);
  if (!user) {
    return res
      .status(401)
      .json({ message: '유효하지 않은 세션입니다. 다시 로그인해 주세요.' });
  }

  const safeUser = userModel.publicUser(user);
  req.user = safeUser;
  req.userId = safeUser.id;
  next();
}

module.exports = requireAuth;
