const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const { withServer, request } = require('./_helper');

const backendRequire = createRequire(
  path.resolve(__dirname, '..', 'backend', 'package.json')
);
const dotenv = backendRequire('dotenv');
const bcrypt = backendRequire('bcrypt');

dotenv.config({
  path: path.resolve(__dirname, '..', 'backend', '.env'),
  quiet: true,
});
const db = require('../backend/db');

const marker = `comate-test-${process.pid}-${Date.now()}`;
const emailA = `${marker}-a@example.com`;
const emailB = `${marker}-b@example.com`;
const password = 'TestPassword123!';
const createdUsers = [];
const createdPosts = [];

function fields(title, departments = [{ deptName: '컴퓨터공학과', maxMembers: 3 }]) {
  return { title, category: '프로젝트', content: '보안 테스트 모집글', deadline: '2027-12-31', departments };
}

async function cleanup() {
  for (const id of createdPosts.reverse()) {
    await db.query('DELETE FROM applications WHERE post_id = $1', [id]);
    await db.query('DELETE FROM posts WHERE id = $1', [id]);
  }
  for (const id of createdUsers.reverse()) {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

async function run() {
  try {
    await withServer(async (baseUrl) => {
      const signupPath = '/api/auth/signup';
      const invalid = [
        { email: emailA, name: '', dept: '컴퓨터공학과', password },
        { email: emailA, name: '테스트', dept: '', password },
        { email: '', name: '테스트', dept: '컴퓨터공학과', password },
        { email: emailA, name: '테스트', dept: '컴퓨터공학과', password: 'short' },
      ];

      for (const body of invalid) {
        const res = await request(baseUrl, signupPath, { method: 'POST', body: JSON.stringify(body) });
        assert.equal(res.status, 400, '회원가입 필수 필드 및 비밀번호 길이 위반은 400이어야 합니다.');
      }

      async function signup(email, name) {
        const res = await request(baseUrl, signupPath, {
          method: 'POST',
          body: JSON.stringify({ email, name, dept: '컴퓨터공학과', password }),
        });
        assert.equal(res.status, 201, '정상 회원가입은 201이어야 합니다.');
        assert.match(String(res.data?.user?.id), /^\d+$/);
        createdUsers.push(res.data.user.id);
        assert.ok(res.cookie, '가입 후 세션 쿠키가 있어야 합니다.');
        assert.equal(Object.hasOwn(res.data.user, 'passwordHash'), false, '회원가입 응답에 passwordHash가 노출되면 안 됩니다.');
        return res;
      }

      const userA = await signup(emailA, '보안테스트A');
      const duplicate = await request(baseUrl, signupPath, {
        method: 'POST',
        body: JSON.stringify({ email: emailA, name: '중복', dept: '컴퓨터공학과', password }),
      });
      assert.equal(duplicate.status, 409, '중복 이메일은 409여야 합니다.');

      const duplicateUppercase = await request(baseUrl, signupPath, {
        method: 'POST',
        body: JSON.stringify({ email: emailA.toUpperCase(), name: '대소문자 중복', dept: '컴퓨터공학과', password }),
      });
      assert.equal(duplicateUppercase.status, 409, '대소문자가 다른 중복 이메일도 409여야 합니다.');
      
      const stored = await db.query('SELECT id, password_hash FROM users WHERE email = $1', [emailA]);
      assert.equal(stored.rows.length, 1, '신규 회원이 DB에 저장되어야 합니다.');
      assert.match(stored.rows[0].password_hash, /^\$2[aby]\$1[0-9]\$/);
      assert.notEqual(stored.rows[0].password_hash, password);
      assert.equal(await bcrypt.compare(password, stored.rows[0].password_hash), true);

      const login = await request(baseUrl, '/api/auth/login', {
        method: 'POST', body: JSON.stringify({ email: emailA, password }),
      });
      assert.equal(login.status, 200, '가입한 계정으로 로그인할 수 있어야 합니다.');
      assert.equal(login.data?.user?.id, userA.data.user.id);
      assert.equal(Object.hasOwn(login.data.user, 'passwordHash'), false, '로그인 응답에 passwordHash가 노출되면 안 됩니다.');

      const me = await request(baseUrl, '/api/auth/me', {}, login.cookie);
      assert.equal(me.status, 200);
      assert.equal(me.data?.user?.id, userA.data.user.id);
      assert.equal(Object.hasOwn(me.data.user, 'passwordHash'), false, '사용자 정보 응답에 passwordHash가 노출되면 안 됩니다.');

      const userB = await signup(emailB, '보안테스트B');

      const unauthCreate = await request(baseUrl, '/api/posts', {
        method: 'POST', body: JSON.stringify(fields(`${marker}-unauth`)),
      });
      assert.equal(unauthCreate.status, 401);
      for (const method of ['PUT', 'DELETE']) {
        const res = await request(baseUrl, '/api/posts/1', {
          method,
          ...(method === 'PUT' ? { body: JSON.stringify(fields(`${marker}-unauth`)) } : {}),
        });
        assert.equal(res.status, 401, `비로그인 ${method} 요청은 401이어야 합니다.`);
      }

      const invalidCapacity = await request(baseUrl, '/api/posts', {
        method: 'POST',
        body: JSON.stringify(fields(`${marker}-invalid-capacity`, [
          { deptName: '컴퓨터공학과', maxMembers: 1001 },
        ])),
      }, userA.cookie);
      if (invalidCapacity.status === 201 && invalidCapacity.data?.id) {
        createdPosts.push(invalidCapacity.data.id);
      }
      assert.equal(invalidCapacity.status, 400, '정원 1000명 초과는 400이어야 합니다.');

      const created = await request(baseUrl, '/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          ...fields(`${marker}-post`),
          authorId: userB.data.user.id,
        }),
      }, userA.cookie);
      assert.equal(created.status, 201);
      const postId = created.data?.id;
      assert.match(String(postId), /^\d+$/);
      createdPosts.push(postId);
      const persisted = await db.query('SELECT author_id FROM posts WHERE id = $1', [postId]);
      assert.equal(String(persisted.rows[0]?.author_id), userA.data.user.id);
      const fetched = await request(baseUrl, `/api/posts/${postId}`);
      assert.equal(fetched.status, 200, '정상 모집글 조회는 200이어야 합니다.');
      assert.equal(fetched.data?.id, postId);
      assert.equal(fetched.data?.title, `${marker}-post`);
      assert.equal(fetched.data?.authorId, userA.data.user.id);
      
      for (const method of ['PUT', 'DELETE']) {
        const res = await request(baseUrl, `/api/posts/${postId}`, {
          method,
          ...(method === 'PUT' ? { body: JSON.stringify(fields(`${marker}-hijack`)) } : {}),
        }, userB.cookie);
        assert.equal(res.status, 403, `타인 모집글 ${method} 요청은 403이어야 합니다.`);
      }

      for (const id of ['not-a-number', '999999999', '0', '-1', '2147483648']) {
        const getRes = await request(baseUrl, `/api/posts/${id}`);
        assert.equal(getRes.status, 404);
        for (const method of ['PUT', 'DELETE']) {
          const res = await request(baseUrl, `/api/posts/${id}`, {
            method,
            ...(method === 'PUT' ? { body: JSON.stringify(fields(`${marker}-missing`)) } : {}),
          }, userA.cookie);
          assert.equal(res.status, 404, `${id}의 ${method} 요청은 404여야 합니다.`);
        }
      }

      await db.query(
        'INSERT INTO applications (post_id, applicant_id, target_dept, message) VALUES ($1, $2, $3, $4)',
        [postId, userB.data.user.id, '컴퓨터공학과', '보안 테스트 지원서']
      );
      
      await db.query(
        `UPDATE post_departments
         SET current_members = $1
         WHERE post_id = $2 AND dept_name = $3`,
        [2, postId, '컴퓨터공학과']
      );

      const updated = await request(baseUrl, `/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(fields(`${marker}-updated`, [
          { deptName: '컴퓨터공학과', maxMembers: 5 },
        ])),
      }, userA.cookie);

      assert.equal(updated.status, 200, '정상 모집글 수정은 200이어야 합니다.');
      assert.equal(updated.data?.title, `${marker}-updated`);

      const updatedDept = await db.query(
        `SELECT current_members, max_members
         FROM post_departments
         WHERE post_id = $1 AND dept_name = $2`,
        [postId, '컴퓨터공학과']
      );

      assert.equal(updatedDept.rows[0]?.current_members, 2);
      assert.equal(updatedDept.rows[0]?.max_members, 5);

      const reduceCapacity = await request(baseUrl, `/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(fields(`${marker}-reduced`, [
          { deptName: '컴퓨터공학과', maxMembers: 1 },
        ])),
      }, userA.cookie);

      assert.equal(reduceCapacity.status, 409, '승인 인원보다 적은 정원 설정은 409여야 합니다.');

      const unchangedDept = await db.query(
        `SELECT current_members, max_members
         FROM post_departments
         WHERE post_id = $1 AND dept_name = $2`,
        [postId, '컴퓨터공학과']
      );

      assert.equal(unchangedDept.rows[0]?.current_members, 2);
      assert.equal(unchangedDept.rows[0]?.max_members, 5);

      const removeDept = await request(baseUrl, `/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(fields(`${marker}-changed`, [{ deptName: '수학과', maxMembers: 3 }])),
      }, userA.cookie);
      assert.equal(removeDept.status, 409, '지원서가 있는 학과 제거는 409여야 합니다.');

      const removePost = await request(baseUrl, `/api/posts/${postId}`, { method: 'DELETE' }, userA.cookie);
      assert.equal(removePost.status, 409, '지원서가 있는 모집글 삭제는 409여야 합니다.');
      const stillExists = await db.query('SELECT id FROM posts WHERE id = $1', [postId]);
      assert.equal(stillExists.rows.length, 1, '거부된 삭제 이후 모집글이 유지되어야 합니다.');

      const deletable = await request(baseUrl, '/api/posts', {
        method: 'POST',
        body: JSON.stringify(fields(`${marker}-deletable`)),
      }, userA.cookie);

      assert.equal(deletable.status, 201);
      const deletableId = deletable.data?.id;
      assert.match(String(deletableId), /^\d+$/);
      createdPosts.push(deletableId);

      const deleted = await request(baseUrl, `/api/posts/${deletableId}`, {
        method: 'DELETE',
      }, userA.cookie);

      assert.equal(deleted.status, 204, '정상 모집글 삭제는 204여야 합니다.');

      const deletedPost = await db.query(
        'SELECT id FROM posts WHERE id = $1',
        [deletableId]
      );

      assert.equal(deletedPost.rows.length, 0);

      const deletedGet = await request(baseUrl, `/api/posts/${deletableId}`);
      assert.equal(deletedGet.status, 404);

      const repeatedDelete = await request(baseUrl, `/api/posts/${deletableId}`, {
        method: 'DELETE',
      }, userA.cookie);

      assert.equal(repeatedDelete.status, 404);
      console.log('[PASS] Test 5: 회원가입, bcrypt, 로그인, 모집글 인증·소유권·지원서 보호 및 상태 코드');
    });
  } finally {
    await cleanup();
    await db.pool.end();
  }
}

run().catch((error) => {
  console.error('[FAIL] Test 5:', error);
  process.exitCode = 1;
});