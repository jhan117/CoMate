const express = require('express');
const path = require('path');
const session = require('express-session');

const authRouter = require('./routes/auth');
const postsRouter = require('./routes/posts');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use(session({
  secret: 'comate-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

app.use('/api', authRouter);
app.use('/api/posts', postsRouter);

app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));