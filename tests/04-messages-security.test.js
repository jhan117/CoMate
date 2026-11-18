const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const { withServer, request, loginAs } = require('./_helper');

const frontendRequire = createRequire(
  path.resolve(__dirname, '..', 'frontend', 'package.json')
);
const backendRequire = createRequire(
  path.resolve(__dirname, '..', 'backend', 'package.json')
);
const { io } = frontendRequire('socket.io-client');
const dotenv = backendRequire('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', 'backend', '.env'),
  quiet: true,
});
const db = require('../backend/db');

// 시드 데이터 기준:
// - Conversation 2: 김희서(id=5, 26000000) <-> 권기영(id=6, 26110091)
// - Conversation 3: 이서연(id=1, 24100412) <-> 박준혁(id=2, 24100815), Message 6 (sender=2)
const OTHER_CONVERSATION_ID = '3';
const OTHER_MESSAGE_ID = '6';
const SHARED_CONVERSATION_ID = '2';
const USER_ELLA_ID = '5';
const USER_KAYE_ID = '6';

function connectSocket(baseUrl, cookie = '') {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      extraHeaders: cookie ? { Cookie: cookie } : {},
    });

    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket 연결 타임아웃'));
    }, 5000);

    socket.once('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });

    socket.once('connect_error', (err) => {
      clearTimeout(timer);
      socket.disconnect();
      reject(err);
    });
  });
}

async function run() {
  await withServer(async (baseUrl) => {
    // 1. 비로그인 상태에서 /api/messages 라우트 접근 시 401 및 Socket 핸드셰이크 차단
    const unauthConv = await request(baseUrl, '/api/messages/conversations');
    assert.equal(unauthConv.status, 401, '비로그인 대화방 목록 조회는 401이어야 합니다.');

    await assert.rejects(
      () => connectSocket(baseUrl, ''),
      /UNAUTHORIZED/,
      '비로그인 Socket.IO 연결은 UNAUTHORIZED로 거절되어야 합니다.'
    );

    // 2. 권기영(id=6), 김희서(id=5), 박준혁(id=2) 각각 로그인
    const kayeLogin = await loginAs(baseUrl, '26110091', '123');
    assert.equal(kayeLogin.status, 200);
    const kayeCookie = kayeLogin.cookie;

    const ellaLogin = await loginAs(baseUrl, '26000000', '123');
    assert.equal(ellaLogin.status, 200);
    const ellaCookie = ellaLogin.cookie;

    const thirdLogin = await loginAs(baseUrl, '24100815', '123');
    assert.equal(thirdLogin.status, 200);
    const thirdCookie = thirdLogin.cookie;

    // 2-1. 전체 회원 목록 조회(/api/messages/recipients)는 제공하지 않음을 확인 (404)
    const removedRecipientsRes = await request(
      baseUrl,
      '/api/messages/recipients',
      {},
      kayeCookie
    );
    assert.equal(
      removedRecipientsRes.status,
      404,
      '전체 사용자 검색(/api/messages/recipients)은 제거되어 404여야 합니다.'
    );

    // 3. 제3자(권기영, id=6)가 타인 간 대화방(Conversation 3: 1 <-> 2) 열람·읽음·전송·수정·삭제 시도 -> 모두 403
    const spoofList = await request(
      baseUrl,
      '/api/messages/conversations?userId=1',
      {},
      kayeCookie
    );
    assert.equal(spoofList.status, 200);
    assert.ok(
      spoofList.data.conversations.every(
        (c) => c.user1Id === USER_KAYE_ID || c.user2Id === USER_KAYE_ID
      ),
      'userId 쿼리 파라미터를 조작해도 본인이 속한 대화방만 조회되어야 합니다.'
    );

    const readOtherConv = await request(
      baseUrl,
      `/api/messages/conversations/${OTHER_CONVERSATION_ID}`,
      {},
      kayeCookie
    );
    assert.equal(readOtherConv.status, 403, '비참여 대화방 상세 조회는 403이어야 합니다.');

    const markOtherRead = await request(
      baseUrl,
      `/api/messages/conversations/${OTHER_CONVERSATION_ID}/read`,
      { method: 'PATCH' },
      kayeCookie
    );
    assert.equal(markOtherRead.status, 403, '비참여 대화방 읽음 처리는 403이어야 합니다.');

    const sendOtherConv = await request(
      baseUrl,
      `/api/messages/conversations/${OTHER_CONVERSATION_ID}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content: '비참여 대화방 무단 전송 시도' }),
      },
      kayeCookie
    );
    assert.equal(sendOtherConv.status, 403, '비참여 대화방 메시지 전송은 403이어야 합니다.');

    const editOtherMsg = await request(
      baseUrl,
      `/api/messages/${OTHER_MESSAGE_ID}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ content: '타인 메시지 무단 수정 시도' }),
      },
      kayeCookie
    );
    assert.equal(editOtherMsg.status, 403, '타인 메시지 수정은 403이어야 합니다.');

    const deleteOtherMsg = await request(
      baseUrl,
      `/api/messages/${OTHER_MESSAGE_ID}`,
      { method: 'DELETE' },
      kayeCookie
    );
    assert.equal(deleteOtherMsg.status, 403, '타인 메시지 삭제는 403이어야 합니다.');

    // 4. 본인에게 대화방 생성 시도 -> 400 차단
    const selfConvRes = await request(
      baseUrl,
      '/api/messages/conversations',
      {
        method: 'POST',
        body: JSON.stringify({ recipientId: USER_KAYE_ID }),
      },
      kayeCookie
    );
    assert.equal(selfConvRes.status, 400, '본인과의 대화방 생성은 400이어야 합니다.');

    // 5. 실시간 Socket.IO 격리, 읽음 처리, 알림 연동 및 Full CRUD 검증
    const kayeSocket = await connectSocket(baseUrl, kayeCookie);
    const ellaSocket = await connectSocket(baseUrl, ellaCookie);
    const thirdSocket = await connectSocket(baseUrl, thirdCookie);

    let thirdReceivedEvent = false;
    thirdSocket.on('message:new', () => {
      thirdReceivedEvent = true;
    });

    const ellaReceivedPromise = new Promise((resolve) => {
      ellaSocket.once('message:new', (payload) => resolve(payload));
    });

    const kayeReadAckPromise = new Promise((resolve) => {
      kayeSocket.once('message:read', (payload) => resolve(payload));
    });

    let createdMsgId = '';

    try {
      const createRes = await request(
        baseUrl,
        `/api/messages/conversations/${SHARED_CONVERSATION_ID}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            senderId: USER_ELLA_ID, // 스푸핑 시도 (무시되고 세션 사용자 ID=6으로 저장되어야 함)
            content: '실시간 보안 테스트 쪽지입니다.',
          }),
        },
        kayeCookie
      );
      assert.equal(createRes.status, 201, '쪽지 생성은 201이어야 합니다.');
      const createdMsg = createRes.data.chatMessage;
      createdMsgId = createdMsg.id;
      assert.equal(
        createdMsg.senderId,
        USER_KAYE_ID,
        'body.senderId를 조작해도 세션 사용자의 ID로 기록되어야 합니다.'
      );
      assert.equal(createdMsg.isRead, false, '초기 전송 상태는 안 읽음(false)이어야 합니다.');

      // 상대방(김희서) 소켓에는 실시간 도착해야 하며, 제3자(박준혁) 소켓에는 도착하면 안 됨
      const ellaRealtimePayload = await ellaReceivedPromise;
      assert.equal(ellaRealtimePayload.chatMessage.id, createdMsg.id);
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.equal(
        thirdReceivedEvent,
        false,
        '제3자 소켓에는 타인의 실시간 쪽지 이벤트가 전달되면 안 됩니다.'
      );

      // 상대방(김희서) 알림 벨에 message_new 알림이 생성되었는지 확인
      const ellaNotiBeforeRead = await request(
        baseUrl,
        '/api/notifications',
        {},
        ellaCookie
      );
      assert.equal(ellaNotiBeforeRead.status, 200);
      const unreadMsgNoti = ellaNotiBeforeRead.data.notifications.find(
        (n) =>
          n.type === 'message_new' &&
          n.conversationId === SHARED_CONVERSATION_ID &&
          !n.isRead
      );
      assert.ok(unreadMsgNoti, '수신자에게 안 읽은 message_new 알림이 생성되어야 합니다.');

      // 상대방(김희서)이 대화방을 읽으면 message:read 이벤트가 권기영에게 전달되고 알림도 읽음 처리됨
      const markReadRes = await request(
        baseUrl,
        `/api/messages/conversations/${SHARED_CONVERSATION_ID}/read`,
        { method: 'PATCH' },
        ellaCookie
      );
      assert.equal(markReadRes.status, 200);
      assert.ok(
        markReadRes.data.readMessageIds.includes(createdMsg.id),
        '수신자가 읽음 처리하면 상대방이 보낸 메시지가 읽음 처리되어야 합니다.'
      );

      const readAckPayload = await kayeReadAckPromise;
      assert.ok(
        readAckPayload.readMessageIds.includes(createdMsg.id),
        '발신자에게 실시간 message:read 이벤트가 전달되어야 합니다.'
      );

      const ellaNotiAfterRead = await request(
        baseUrl,
        '/api/notifications',
        {},
        ellaCookie
      );
      const stillUnreadNoti = ellaNotiAfterRead.data.notifications.find(
        (n) => n.id === unreadMsgNoti.id && !n.isRead
      );
      assert.equal(
        stillUnreadNoti,
        undefined,
        '대화방을 읽으면 해당 대화방의 message_new 알림도 함께 읽음 처리되어야 합니다.'
      );

      // 같은 대화방의 상대방(김희서)이라 하더라도 권기영이 보낸 메시지를 수정·삭제할 수 없어야 함 (403)
      const recipientEditAttempt = await request(
        baseUrl,
        `/api/messages/${createdMsg.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ content: '수신자가 발신자 메시지를 수정 시도' }),
        },
        ellaCookie
      );
      assert.equal(
        recipientEditAttempt.status,
        403,
        '대화 상대방이라도 본인이 작성하지 않은 메시지는 수정할 수 없어야 합니다 (403).'
      );

      const recipientDeleteAttempt = await request(
        baseUrl,
        `/api/messages/${createdMsg.id}`,
        { method: 'DELETE' },
        ellaCookie
      );
      assert.equal(
        recipientDeleteAttempt.status,
        403,
        '대화 상대방이라도 본인이 작성하지 않은 메시지는 삭제할 수 없어야 합니다 (403).'
      );

      // 발신자 본인(권기영)이 동일 내용으로 수정 시 409, 새 내용으로 수정 시 200, 삭제 시 200
      const sameContentEdit = await request(
        baseUrl,
        `/api/messages/${createdMsg.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ content: '실시간 보안 테스트 쪽지입니다.' }),
        },
        kayeCookie
      );
      assert.equal(sameContentEdit.status, 409, '동일 내용 수정은 409이어야 합니다.');

      const validEdit = await request(
        baseUrl,
        `/api/messages/${createdMsg.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ content: '수정된 보안 테스트 쪽지입니다.' }),
        },
        kayeCookie
      );
      assert.equal(validEdit.status, 200, '본인 메시지 수정은 200이어야 합니다.');
      assert.equal(validEdit.data.chatMessage.isEdited, true);

      const validDelete = await request(
        baseUrl,
        `/api/messages/${createdMsg.id}`,
        { method: 'DELETE' },
        kayeCookie
      );
      assert.equal(validDelete.status, 200, '본인 메시지 삭제는 200이어야 합니다.');
      assert.equal(validDelete.data.chatMessage.isDeleted, true);
      assert.equal(
        validDelete.data.chatMessage.content,
        '삭제된 메시지입니다.',
        '삭제된 메시지는 내용만 "삭제된 메시지입니다."로 대체되어야 합니다.'
      );

      // 삭제된 메시지에 대한 재수정/재삭제 시도는 409로 차단
      const editAfterDelete = await request(
        baseUrl,
        `/api/messages/${createdMsg.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ content: '삭제 후 수정 시도' }),
        },
        kayeCookie
      );
      assert.equal(editAfterDelete.status, 409, '삭제된 메시지 수정 시도는 409여야 합니다.');

      const deleteAfterDelete = await request(
        baseUrl,
        `/api/messages/${createdMsg.id}`,
        { method: 'DELETE' },
        kayeCookie
      );
      assert.equal(deleteAfterDelete.status, 409, '이미 삭제된 메시지 재삭제 시도는 409여야 합니다.');

      // 탭별 알림 일괄 읽음/삭제 및 스푸핑 차단 검증
      const invalidFilterRes = await request(
        baseUrl,
        '/api/notifications?filter=invalid_tab',
        { method: 'DELETE' },
        ellaCookie
      );
      assert.equal(invalidFilterRes.status, 400, '유효하지 않은 알림 필터는 400이어야 합니다.');

      const deleteMsgNotiTabRes = await request(
        baseUrl,
        '/api/notifications?filter=message&userId=1',
        { method: 'DELETE' },
        ellaCookie
      );
      assert.equal(deleteMsgNotiTabRes.status, 200);
      assert.ok(
        deleteMsgNotiTabRes.data.deletedCount >= 1,
        '쪽지 탭 일괄 삭제 시 본인의 message_new 알림만 삭제되어야 합니다.'
      );
      assert.ok(
        !deleteMsgNotiTabRes.data.notifications.some((n) => n.type === 'message_new'),
        '쪽지 탭 일괄 삭제 후 본인의 message_new 알림이 남아 있으면 안 됩니다.'
      );
    } finally {
      kayeSocket.disconnect();
      ellaSocket.disconnect();
      thirdSocket.disconnect();
      if (createdMsgId) {
        await db.query('DELETE FROM messages WHERE id = $1', [createdMsgId]);
      }
      await db.pool.end();
    }

    // 6. 로그아웃 후 기존 세션 쿠키로 REST 및 Socket.IO 재연결 차단 확인
    const logoutRes = await request(
      baseUrl,
      '/api/auth/logout',
      { method: 'POST' },
      thirdCookie
    );
    assert.equal(logoutRes.status, 204);

    const afterLogoutRest = await request(
      baseUrl,
      '/api/messages/conversations',
      {},
      thirdCookie
    );
    assert.equal(
      afterLogoutRest.status,
      401,
      '로그아웃 후 구 쿠키로 /api/messages/conversations 접근 시 401이어야 합니다.'
    );

    await assert.rejects(
      () => connectSocket(baseUrl, thirdCookie),
      /UNAUTHORIZED/,
      '로그아웃 후 폐기된 세션 쿠키로 Socket.IO 연결 시 거절되어야 합니다.'
    );

    console.log(
      '[PASS] Test 4: 쪽지 Full CRUD, 읽음 처리·알림 연동, 권한 격리(401/403/404/409), Socket.IO 세션 인증 및 실시간 룸 격리 확인'
    );
  });
}

run().catch((error) => {
  console.error('[FAIL] Test 4:', error);
  process.exit(1);
});
