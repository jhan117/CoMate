const express = require('express');
const router = express.Router();

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

router.get('/', (req, res) => {
  res.json(memoryPosts);
});

router.post('/', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: '로그인이 필요한 기능입니다.' });

  const { title, departments, deadline } = req.body;
  const newPost = {
    id: Date.now().toString(),
    title,
    author: req.session.user.name,
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

router.put('/:id/join', (req, res) => {
  const { deptName } = req.body;
  const post = memoryPosts.find(p => p.id === req.params.id);

  if (!post) return res.status(404).json({ message: '글을 찾을 수 없습니다.' });
  if (!req.session.user || req.session.user.name !== post.author) return res.status(403).json({ message: '작성자만 승인할 수 있습니다.' });

  const dept = post.departments.find(d => d.deptName === deptName);
  if (dept && dept.currentMembers < dept.maxMembers) {
    dept.currentMembers += 1;
    return res.json(post);
  }
  res.status(400).json({ message: '인원이 가득 찼거나 학과를 찾을 수 없습니다.' });
});

router.delete('/:id', (req, res) => {
  const post = memoryPosts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: '글을 찾을 수 없습니다.' });
  if (!req.session.user || req.session.user.name !== post.author) return res.status(403).json({ message: '작성자만 삭제할 수 있습니다.' });

  memoryPosts = memoryPosts.filter(p => p.id !== req.params.id);
  res.json({ message: '삭제되었습니다.' });
});

module.exports = router;