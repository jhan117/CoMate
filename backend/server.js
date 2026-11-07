const express = require('express');
const cors = require('cors');
const applicationsRouter = require('./routes/applications');

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

app.use('/api/applications', applicationsRouter);

app.listen(PORT, () => {
  console.log(`CoMate 백엔드 서버 실행 중: http://localhost:${PORT}`);
});
