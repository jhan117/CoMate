const express = require('express');
const router = express.Router();

let users = [
  { id: 'user1', password: '123', name: '김모임', dept: '시각디자인학과' },
  { id: 'user2', password: '123', name: '박기획', dept: '인공지능학과' },
  { id: 'ella', password: '123', name: '엘라', dept: '컴퓨터공학과' }
];

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.id === username && u.password === password);

  if (user) {
    req.session.user = { id: user.id, name: user.name, dept: user.dept };
    return res.json({ success: true, message: '로그인 성공!', user: req.session.user });
  }
  res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: '로그아웃 되었습니다.' });
});

router.get('/me', (req, res) => {
  if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
  else res.json({ loggedIn: false });
});

module.exports = router;