const express = require('express');
const path = require('path');
const Post = require('./models/Post');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

let memoryPosts = [
  {
    id: '1',
    title: '2026 대학생 해커톤',
    author: '김모임',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    departments: [
      { deptName: '컴퓨터공학과', currentMembers: 1, maxMembers: 3 },
      { deptName: '시각디자인학과', currentMembers: 0, maxMembers: 2 }
    ],
    deadline: '2026-11-05'
  }
];

app.get('/api/posts', (req, res) => {
  res.json(memoryPosts);
});

app.post('/api/posts', (req, res) => {
  const { title, author, departments, deadline } = req.body;

  if (!title || !departments || departments.length === 0 || !deadline) {
    return res.status(400).json({ message: '모든 필수 항목을 입력해주세요.' });
  }

  const newPost = {
    id: Date.now().toString(),
    title,
    author: author || '작성자',
    createdAt: new Date(),
    departments: departments.map(d => ({
      deptName: d.deptName,
      currentMembers: 0,
      maxMembers: Number(d.maxMembers)
    })),
    deadline
  };

  memoryPosts.push(newPost);
  res.status(201).json(newPost);
});

app.put('/api/posts/:id/join', (req, res) => {
  const { deptName } = req.body;
  const post = memoryPosts.find(p => p.id === req.params.id);

  if (!post) return res.status(404).json({ message: '글을 찾을 수 없습니다.' });

  const dept = post.departments.find(d => d.deptName === deptName);
  if (dept && dept.currentMembers < dept.maxMembers) {
    dept.currentMembers += 1;
    return res.json(post);
  }
  res.status(400).json({ message: '인원이 가득 찼거나 학과를 찾을 수 없습니다.' });
});

app.delete('/api/posts/:id', (req, res) => {
  const postIndex = memoryPosts.findIndex(p => p.id === req.params.id);
  if (postIndex === -1) return res.status(404).json({ message: '글을 찾을 수 없습니다.' });

  memoryPosts.splice(postIndex, 1);
  res.json({ message: '삭제되었습니다.' });
});

app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));