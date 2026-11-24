const assert = require('node:assert/strict');
const { withServer, request, loginAs } = require('./_helper');

// 시드 데이터 기준:
// - User A (이서연, id=1): Post 1 작성자, Notification 7·8 수신자
// - User A2 (박준혁, id=2): Post 1의 Application 1 작성자
// - User B (오민재, id=6, 이메일 user6@comate.test): 타인
const USER_A_ID = '1';
const USER_A_POST_ID = '1';
const USER_A_APP_ID = '1';
const USER_A_NOTI_ID = '7';
const USER_B_ID = '6';

async function run() {
  await withServer(async (baseUrl) => {
    // 0. 비로그인 상태에서는 지원/알림 Private 라우트 접근 불가 (401)
    const unauthApps = await request(
      baseUrl,
      `/api/applications?postId=${USER_A_POST_ID}`
    );
    assert.equal(unauthApps.status, 401, '비로그인 지원서 조회는 401이어야 합니다.');

    const unauthNotis = await request(baseUrl, '/api/notifications');
    assert.equal(unauthNotis.status, 401, '비로그인 알림 조회는 401이어야 합니다.');

    // 1. User B (오민재) 로그인
    const loginRes = await loginAs(baseUrl, 'user6@comate.test', 'test1234');
    assert.equal(loginRes.status, 200, 'User B 로그인이 성공해야 합니다.');
    const userBCookie = loginRes.cookie;
    assert.ok(userBCookie, '로그인 세션 쿠키가 발급되어야 합니다.');

    // 2. User B가 User A의 모집글(Post 1) 지원 현황 조회 시 타인 지원서 목록은 노출되지 않아야 함
    const listRes = await request(
      baseUrl,
      `/api/applications?postId=${USER_A_POST_ID}`,
      {},
      userBCookie
    );
    assert.equal(listRes.status, 200);
    assert.ok(
      listRes.data.post.totalApplicants >= 1,
      '테스트 전제: Post 1에는 타인의 지원서가 1건 이상 존재해야 합니다.'
    );
    assert.ok(
      listRes.data.applications.every((app) => app.applicantId === USER_B_ID),
      '일반 지원자에게 타인의 지원서 목록이 노출되면 안 됩니다.'
    );

    // 3. User B가 User A의 지원서(app 1)를 직접 ID로 조회·수정·승인·삭제 시도 -> 모두 403
    const getAppRes = await request(
      baseUrl,
      `/api/applications/${USER_A_APP_ID}`,
      {},
      userBCookie
    );
    assert.equal(getAppRes.status, 403, '타인 지원서 단건 조회는 403이어야 합니다.');

    const putAppRes = await request(
      baseUrl,
      `/api/applications/${USER_A_APP_ID}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          targetDept: '학과 무관',
          message: '타인의 지원서를 무단 수정하려는 시도입니다.',
        }),
      },
      userBCookie
    );
    assert.equal(putAppRes.status, 403, '타인 지원서 수정은 403이어야 합니다.');

    const patchStatusRes = await request(
      baseUrl,
      `/api/applications/${USER_A_APP_ID}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      },
      userBCookie
    );
    assert.equal(
      patchStatusRes.status,
      403,
      '작성자가 아닌 사용자가 지원서 상태 변경 시 403이어야 합니다.'
    );

    const deleteAppRes = await request(
      baseUrl,
      `/api/applications/${USER_A_APP_ID}`,
      { method: 'DELETE' },
      userBCookie
    );
    assert.equal(deleteAppRes.status, 403, '타인 지원서 취소(삭제)는 403이어야 합니다.');

    // 4. User B가 userId 쿼리 스푸핑(?userId=1) 및 타인 알림(noti 7) 읽음/삭제 시도 -> 차단 확인
    const spoofNotiRes = await request(
      baseUrl,
      `/api/notifications?userId=${USER_A_ID}`,
      {},
      userBCookie
    );
    assert.equal(spoofNotiRes.status, 200);
    assert.ok(
      spoofNotiRes.data.notifications.every(
        (noti) => noti.recipientId === USER_B_ID
      ),
      '쿼리 파라미터 userId를 조작해도 세션 사용자 본인의 알림만 조회되어야 합니다.'
    );

    const readNotiRes = await request(
      baseUrl,
      `/api/notifications/${USER_A_NOTI_ID}/read`,
      { method: 'PATCH' },
      userBCookie
    );
    assert.equal(readNotiRes.status, 403, '타인 알림 읽음 처리는 403이어야 합니다.');

    const deleteNotiRes = await request(
      baseUrl,
      `/api/notifications/${USER_A_NOTI_ID}`,
      { method: 'DELETE' },
      userBCookie
    );
    assert.equal(deleteNotiRes.status, 403, '타인 알림 삭제는 403이어야 합니다.');

    console.log(
      '[PASS] Test 2: 타 사용자(User B)의 지원서/알림 열람·수정·삭제 차단(403 및 데이터 격리) 확인'
    );
  });
}

run().catch((error) => {
  console.error('[FAIL] Test 2:', error);
  process.exit(1);
});
