require('dotenv').config();
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { initSocket } = require('./socket');
const applicationsRouter = require('./routes/applications');
const notificationsRouter = require('./routes/notifications');
const messagesRouter = require('./routes/messages');
const postsRouter = require('./routes/posts');
const session = require('express-session');
const authRouter = require('./routes/auth');

const app = express();
const httpServer = http.createServer(app);
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

const sessionSecret =
  process.env.COMATE_SESSION_SECRET || process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error(
    'COMATE_SESSION_SECRET 또는 SESSION_SECRET 환경 변수를 설정해야 합니다.'
  );
}

if (sessionSecret.length < 32) {
  throw new Error(
    '세션 비밀키는 32자 이상이어야 합니다.'
  );
}

const sessionMiddleware = session({
  name: 'comate.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    secure: isProduction,
    maxAge: 8 * 60 * 60 * 1000,
  },
});

app.use(sessionMiddleware);
initSocket(httpServer, { sessionMiddleware, allowedOrigins });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

app.use('/api/applications', applicationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/posts', postsRouter);

const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      !req.path.startsWith('/api') &&
      !req.path.startsWith('/socket.io')
    ) {
      return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
    next();
  });
}

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
});

db.initDatabase()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`CoMate 서버 실행 중: http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('데이터베이스 초기화 실패:', error);
    process.exit(1);
  });
