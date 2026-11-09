const posts = require('../models/postModel');
const store = require('../store');

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function list(req, res) {
  return res.json(posts.list());
}

function get(req, res) {
  const post = posts.find(req.params.id);
  if (!post) return res.status(404).json({ message: '모집글을 찾을 수 없습니다.' });

  return res.json(posts.withAuthor(post));
}

function requireActor(req, res, next) {
  const id = req.session?.user?.id;

  if (!store.users.some((user) => user.id === id)) {
    return res.status(401).json({ message: '모집글을 관리하려면 로그인해 주세요.' });
  }

  res.locals.actorId = id;
  next();
}

function requireOwner(req, res, next) {
  const post = posts.find(req.params.id);
  if (!post) return res.status(404).json({ message: '모집글을 찾을 수 없습니다.' });

  if (post.authorId !== res.locals.actorId) {
    return res.status(403).json({ message: '작성자만 수정하거나 삭제할 수 있습니다.' });
  }

  res.locals.post = post;
  next();
}

function validateFields(req, res, next) {
  const title = clean(req.body?.title);
  const category = clean(req.body?.category);
  const content = clean(req.body?.content);
  const deadline = clean(req.body?.deadline);
  const departments = req.body?.departments;
  const date = new Date(`${deadline}T00:00:00Z`);

  if (
    !title || !category ||
    !/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== deadline ||
    !Array.isArray(departments) || departments.length === 0
  ) {
    return res.status(400).json({ message: '제목, 분류, 마감일, 모집 학과를 확인해 주세요.' });
  }

  const names = new Set();
  const quotas = [];

  for (const department of departments) {
    const deptName = clean(department?.deptName);
    const maxMembers = department?.maxMembers;

    if (!deptName || names.has(deptName) || !Number.isSafeInteger(maxMembers) || maxMembers < 1) {
      return res.status(400).json({
        message: '학과 이름은 중복 없이 입력하고 정원은 1명 이상으로 설정해 주세요.',
      });
    }

    names.add(deptName);
    quotas.push({ deptName, maxMembers, currentMembers: 0 });
  }

  res.locals.fields = { title, category, content, deadline, departments: quotas };
  next();
}

function create(req, res) {
  return res.status(201).json(posts.create(res.locals.fields, res.locals.actorId));
}

function update(req, res) {
  const post = posts.update(res.locals.post, res.locals.fields);
  if (!post) {
    return res.status(409).json({
      message: '지원 기록이 있는 학과는 유지하고, 정원은 현재 승인 인원 이상으로 설정해 주세요.',
    });
  }

  return res.json(post);
}

function remove(req, res) {
  if (!posts.remove(res.locals.post)) {
    return res.status(409).json({ message: '지원서가 있는 모집글은 삭제할 수 없습니다.' });
  }

  return res.status(204).end();
}

module.exports = { list, get, requireActor, requireOwner, validateFields, create, update, remove };