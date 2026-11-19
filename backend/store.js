const { seedData } = require('./db/seed');

// 회원(users) 및 모집글(posts) 모델이 PostgreSQL로 전환되기 전까지 유지하는 임시 인메모리 스토어
const store = {
  users: seedData.users.map((u) => ({ ...u, password: '123' })),
  posts: seedData.posts.map((p) => ({
    ...p,
    departments: p.departments.map((d) => ({ ...d })),
  })),
  applications: [],
  notifications: [],
};

module.exports = store;
