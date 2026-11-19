const assert = require('node:assert/strict');
const { withServer, loginAs } = require('./_helper');

async function run() {
  await withServer(async (baseUrl) => {
    // 1. 존재하지 않는 학번으로 로그인 시도 -> 401
    const unknownUserRes = await loginAs(baseUrl, '99999999', 'wrong-password');
    assert.equal(
      unknownUserRes.status,
      401,
      `존재하지 않는 학번 로그인은 401이어야 합니다 (실제: ${unknownUserRes.status})`
    );
    assert.ok(
      unknownUserRes.data?.message,
      '에러 메시지가 반환되어야 합니다.'
    );

    // 2. 존재하는 학번(26110091) + 잘못된 비밀번호로 로그인 시도 -> 401
    const wrongPasswordRes = await loginAs(baseUrl, '26110091', 'wrong-password');
    assert.equal(
      wrongPasswordRes.status,
      401,
      `잘못된 비밀번호 로그인은 401이어야 합니다 (실제: ${wrongPasswordRes.status})`
    );
    assert.ok(
      wrongPasswordRes.data?.message,
      '에러 메시지가 반환되어야 합니다.'
    );

    // 3. 계정 존재 여부가 노출되지 않도록 두 경우 모두 동일한 메시지 반환 검증
    assert.equal(
      unknownUserRes.data.message,
      wrongPasswordRes.data.message,
      '미등록 학번과 오답 비밀번호의 401 에러 메시지가 동일해야 합니다.'
    );

    console.log(
      `[PASS] Test 1: 잘못된 로그인 401 및 동일 에러 메시지 확인 ("${wrongPasswordRes.data.message}")`
    );
  });
}

run().catch((error) => {
  console.error('[FAIL] Test 1:', error);
  process.exit(1);
});
