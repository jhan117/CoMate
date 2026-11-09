const { randomUUID } = require('node:crypto');
const store = require('../store');

function withAuthor(post) {
  const user = store.users.find((user) => user.id === post.authorId);
  return { ...post, author: user?.name ?? '알 수 없음' };
}

function list() {
  return [...store.posts]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(withAuthor);
}

function find(id) {
  return store.posts.find((post) => post.id === id);
}

function create(fields, authorId) {
  const post = {
    ...fields,
    id: randomUUID(),
    authorId,
    createdAt: new Date().toISOString(),
  };

  store.posts.push(post);
  return withAuthor(post);
}

function update(post, fields) {
  const applications = store.applications.filter((app) => app.postId === post.id);
  const departments = fields.departments.map((dept) => ({
    ...dept,
    currentMembers:
      post.departments.find((old) => old.deptName === dept.deptName)?.currentMembers ?? 0,
  }));

  const removedUsedDepartment = post.departments.some((old) =>
    !departments.some((dept) => dept.deptName === old.deptName) &&
    (old.currentMembers > 0 || applications.some((app) => app.targetDept === old.deptName))
  );

  if (removedUsedDepartment || departments.some((dept) => dept.maxMembers < dept.currentMembers)) {
    return null;
  }

  Object.assign(post, fields, { departments });
  return withAuthor(post);
}

function remove(post) {
  if (store.applications.some((app) => app.postId === post.id)) return false;

  store.posts.splice(store.posts.indexOf(post), 1);
  return true;
}

module.exports = { withAuthor, list, find, create, update, remove };