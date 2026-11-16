const express = require('express');
const cors = require('cors');
const applicationsRouter = require('./routes/applications');
const notificationsRouter = require('./routes/notifications');
const postsRouter = require('./routes/posts');
const session = require('express-session');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.COMATE_SESSION_SECRET;

if (isProduction && !sessionSecret) {
  throw new Error(
    '배포 환경에서는 COMATE_SESSION_SECRET 환경 변수를 설정해야 합니다.'
  );
}

if (!isProduction && !sessionSecret) {
  console.warn(
    '개발 환경: COMATE_SESSION_SECRET이 설정되지 않아 임시 세션 키를 사용합니다.'
  );
}

app.use(session({
  name: 'comate.sid',
  secret: sessionSecret || 'comate-local-development-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    secure: isProduction,
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

app.use('/api/applications', applicationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/posts', postsRouter);

app.listen(PORT, () => {
  console.log(`CoMate 백엔드 서버 실행 중: http://localhost:${PORT}`);
});
