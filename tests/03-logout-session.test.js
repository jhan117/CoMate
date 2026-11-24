const assert = require('node:assert/strict');
const { withServer, request, loginAs } = require('./_helper');

async function run() {
  await withServer(async (baseUrl) => {
    // 1. 로그인 및 세션 쿠키 저장
    const loginRes = await loginAs(baseUrl, 'user6@comate.test', 'test1234');
    assert.equal(loginRes.status, 200, '로그인이 성공해야 합니다.');
    const oldSessionCookie = loginRes.cookie;
    assert.ok(oldSessionCookie, '세션 쿠키가 발급되어야 합니다.');

    // 2. 로그아웃 전 기존 쿠키로 Private 라우트 정상 접근(200) 확인
    const beforeOverview = await request(
      baseUrl,
      '/api/applications/overview',
      {},
      oldSessionCookie
    );
    assert.equal(
      beforeOverview.status,
      200,
      '로그아웃 전에는 세션 쿠키로 /api/applications/overview 접근이 가능해야 합니다.'
    );

    const beforeNoti = await request(
      baseUrl,
      '/api/notifications',
      {},
      oldSessionCookie
    );
    assert.equal(
      beforeNoti.status,
      200,
      '로그아웃 전에는 세션 쿠키로 /api/notifications 접근이 가능해야 합니다.'
    );

    const beforeMe = await request(
      baseUrl,
      '/api/auth/me',
      {},
      oldSessionCookie
    );
    assert.equal(beforeMe.status, 200);
    assert.equal(beforeMe.data?.user?.email, 'user6@comate.test');
    assert.equal(beforeMe.data?.user?.passwordHash, undefined);

    // 3. 로그아웃 요청 (서버 세션 파기)
    const logoutRes = await request(
      baseUrl,
      '/api/auth/logout',
      { method: 'POST' },
      oldSessionCookie
    );
    assert.equal(logoutRes.status, 204, '로그아웃은 204를 반환해야 합니다.');

    // 4. 폐기된 기존 세션 쿠키를 재사용해 Private 라우트 접근 시도 -> 모두 401 차단 확인
    const afterOverview = await request(
      baseUrl,
      '/api/applications/overview',
      {},
      oldSessionCookie
    );
    assert.equal(
      afterOverview.status,
      401,
      '로그아웃 후 기존 세션 쿠키로 /api/applications/overview 요청 시 401이어야 합니다.'
    );

    const afterNoti = await request(
      baseUrl,
      '/api/notifications',
      {},
      oldSessionCookie
    );
    assert.equal(
      afterNoti.status,
      401,
      '로그아웃 후 기존 세션 쿠키로 /api/notifications 요청 시 401이어야 합니다.'
    );

    const afterMe = await request(
      baseUrl,
      '/api/auth/me',
      {},
      oldSessionCookie
    );
    assert.equal(
      afterMe.status,
      401,
      '로그아웃 후 기존 세션 쿠키로 /api/auth/me 요청 시 401이어야 합니다.'
    );

    console.log(
      '[PASS] Test 3: 로그아웃 이후 기존 세션 쿠키 무효화(401 차단) 확인'
    );
  });
}

run().catch((error) => {
  console.error('[FAIL] Test 3:', error);
  process.exit(1);
});
