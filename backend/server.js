const express = require('express');
const cors = require('cors');
const applicationsRouter = require('./routes/applications');
const postsRouter = require('./routes/posts');
const session = require('express-session');
const authRouter = require('./routes/auth');

const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.COMATE_SESSION_SECRET;

if (!sessionSecret) {
  throw new Error('COMATE_SESSION_SECRET 환경 변수를 설정해 주세요.');
}

app.use(session({
  name: 'comate.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

app.use('/api/auth', authRouter);

app.use('/api/applications', applicationsRouter);
app.use('/api/posts', postsRouter);

app.listen(PORT, () => {
  console.log(`CoMate 백엔드 서버 실행 중: http://localhost:${PORT}`);
});
