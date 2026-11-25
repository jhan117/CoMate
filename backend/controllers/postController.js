const posts = require('../models/postModel');

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function list(req, res, next) {
  try {
    const result = await posts.list();
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    const post = await posts.find(req.params.id);

    if (!post) {
      return res.status(404).json({ message: '모집글을 찾을 수 없습니다.' });
    }

    return res.json(post);
  } catch (error) {
    next(error);
  }
}

async function requireOwner(req, res, next) {
  try {
    const post = await posts.find(req.params.id);

    if (!post) {
      return res.status(404).json({ message: '모집글을 찾을 수 없습니다.' });
    }

    if (post.authorId !== String(req.userId)) {
      return res.status(403).json({ message: '작성자만 수정하거나 삭제할 수 있습니다.' });
    }

    res.locals.post = post;
    next();
  } catch (error) {
    next(error);
  }
}

function validateFields(req, res, next) {
  const title = clean(req.body?.title);
  const category = clean(req.body?.category);
  const content = clean(req.body?.content);
  const deadline = clean(req.body?.deadline);
  const departments = req.body?.departments;
  const date = new Date(`${deadline}T00:00:00Z`);

  if (
    typeof req.body?.title !== 'string' ||
    !title || title.length > 200 ||
    typeof req.body?.category !== 'string' ||
    !category || category.length > 50 ||
    typeof req.body?.content !== 'string' ||
    content.length > 5000 ||
    typeof req.body?.deadline !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== deadline ||
    !Array.isArray(departments) || departments.length === 0
  ) {
    return res.status(400).json({ message: '제목, 분류, 내용(5000자 이내), 마감일, 모집 학과를 확인해 주세요.' });
  }

  const names = new Set();
  const quotas = [];

  for (const department of departments) {
    const deptName = clean(department?.deptName);
    const maxMembers = department?.maxMembers;


    if (
      !deptName ||
      deptName.length > 100 ||
      names.has(deptName) ||
      !Number.isSafeInteger(maxMembers) ||
      maxMembers < 1 ||
      maxMembers > 1000
    ) {
      return res.status(400).json({
        message: '학과 이름은 100자 이내로 중복 없이 입력하고 정원은 1명 이상 1000명 이하로 설정해 주세요.',
      });
    }


    names.add(deptName);
    quotas.push({ deptName, maxMembers, currentMembers: 0 });
  }

  res.locals.fields = { title, category, content, deadline, departments: quotas };
  next();
}

async function create(req, res, next) {
  try {
    const post = await posts.create(res.locals.fields, req.userId);
    return res.status(201).json(post);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const post = await posts.update(res.locals.post, res.locals.fields);

    if (!post) {
      const existingPost = await posts.find(req.params.id);

      if (!existingPost) {
        return res.status(404).json({
          message: '모집글을 찾을 수 없습니다.',
        });
      }

      return res.status(409).json({
        message: '지원 기록이 있는 학과는 유지하고, 정원은 현재 승인 인원 이상으로 설정해 주세요.',
      });
    }

    return res.json(post);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await posts.remove(res.locals.post);

    if (result === 'not_found') {
      return res.status(404).json({ message: '모집글을 찾을 수 없습니다.' });
    }

    if (result === 'conflict') {
      return res.status(409).json({ message: '지원서가 있는 모집글은 삭제할 수 없습니다.' });
    }

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { list, get, requireOwner, validateFields, create, update, remove };