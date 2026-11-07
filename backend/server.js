const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

const supabaseUrl = process.env.SUPABASE_URL || 'https://thtjbdgukmmnfjyadanx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodGpiZGd1a21tbmZqeWFkYW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MjQyNTIsImV4cCI6MjEwOTUwMDI1Mn0.EYjwY4iZ3LgraYOJ8zIoSxQUFYB_N9H7GnKkfKj2eQY';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'comate-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

let users = [
  { id: 'user1', password: '123', name: '김모임', dept: '시각디자인학과' },
  { id: 'user2', password: '123', name: '박기획', dept: '인공지능학과' },
  { id: 'ella', password: '123', name: '엘라', dept: '컴퓨터공학과' }
];

app.post('/api/signup', (req, res) => {
  const { username, password, name, dept } = req.body;

  if (!username || !password || !name || !dept) {
    return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
  }

  const existingUser = users.find(u => u.id === username);
  if (existingUser) {
    return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
  }

  const newUser = { id: username, password, name, dept };
  users.push(newUser);

  res.status(201).json({ message: '회원가입이 완료되었습니다! 로그인해주세요.' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.id === username && u.password === password);

  if (user) {
    req.session.user = { id: user.id, name: user.name, dept: user.dept };
    return res.json({ message: '로그인 성공!', user: req.session.user });
  }
  res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: '로그아웃 되었습니다.' });
});

app.get('/api/me', (req, res) => {
  if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
  else res.json({ loggedIn: false });
});

app.get('/api/posts', async (req, res) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

app.post('/api/posts', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: '로그인이 필요한 기능입니다.' });

  const { title, departments, deadline } = req.body;
  if (!title || !departments || departments.length === 0 || !deadline) {
    return res.status(400).json({ message: '모든 필수 항목을 입력해주세요.' });
  }

  const formattedDepts = departments.map(d => ({
    deptName: d.deptName,
    currentMembers: 0,
    maxMembers: Number(d.maxMembers)
  }));

  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        title,
        author: req.session.user.name,
        departments: formattedDepts,
        deadline
      }
    ])
    .select();

  if (error) {
    console.error('Supabase 저장 에러 상세:', error);
    return res.status(500).json({ message: error.message || error.details || error.hint || 'Supabase 저장 에러가 발생했습니다.' });
  }

  if (!data || data.length === 0) return res.status(500).json({ message: '저장에 실패했습니다.' });

  res.status(201).json(data[0]);
});

app.put('/api/posts/:id/join', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: '로그인이 필요한 기능입니다.' });

  const { deptName } = req.body;
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !post) return res.status(404).json({ message: '글을 찾을 수 없습니다.' });
  if (req.session.user.name !== post.author) return res.status(403).json({ message: '작성자만 승인할 수 있습니다.' });

  const updatedDepts = post.departments.map(d => {
    if (d.deptName === deptName && d.currentMembers < d.maxMembers) {
      return { ...d, currentMembers: d.currentMembers + 1 };
    }
    return d;
  });

  const { data: updatedPost, error: updateError } = await supabase
    .from('posts')
    .update({ departments: updatedDepts })
    .eq('id', req.params.id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ message: updateError.message });
  res.json(updatedPost);
});

app.delete('/api/posts/:id', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: '로그인이 필요한 기능입니다.' });

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!post) return res.status(404).json({ message: '글을 찾을 수 없습니다.' });
  if (req.session.user.name !== post.author) return res.status(403).json({ message: '작성자만 삭제할 수 있습니다.' });

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: '삭제되었습니다.' });
});

app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));