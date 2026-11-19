// bcrypt hash for '123' (cost 10)
const DEFAULT_PASSWORD_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

function daysAgoAtKst(daysAgo, hour, minute) {
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstNow = new Date(Date.now() + kstOffsetMs);
  kstNow.setUTCDate(kstNow.getUTCDate() - daysAgo);
  kstNow.setUTCHours(hour, minute, 0, 0);
  return new Date(kstNow.getTime() - kstOffsetMs).toISOString();
}

function deadlineOffsetKst(offsetDays) {
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstDate = new Date(Date.now() + kstOffsetMs);
  kstDate.setUTCDate(kstDate.getUTCDate() + offsetDays);
  return kstDate.toISOString().slice(0, 10);
}

const seedData = {
  users: [
    { id: '1', studentId: '24100412', name: '이서연', dept: '디자인학과' },
    { id: '2', studentId: '24100815', name: '박준혁', dept: '경영학과' },
    { id: '3', studentId: '23100521', name: '최민수', dept: '컴퓨터공학과' },
    { id: '4', studentId: '25100319', name: '정다은', dept: '미디어학과' },
    { id: '5', studentId: '26110093', name: '김희서', dept: '컴퓨터공학과' },
    { id: '6', studentId: '26110091', name: '권기영', dept: '컴퓨터공학과' },
  ],
  posts: [
    {
      id: '1',
      category: '해커톤',
      title: '2026 대학생 AI 서비스 해커톤 팀원 모집',
      content:
        '교내 대표로 2026 AI 해커톤에 출전할 개발자 및 기획/디자이너 팀원을 모집합니다. 주 1회 대면 또는 온라인 회의가 가능한 분이면 좋겠습니다.',
      authorId: '1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      departments: [
        { deptName: '컴퓨터공학과', currentMembers: 0, maxMembers: 3 },
        { deptName: '디자인학과', currentMembers: 0, maxMembers: 2 },
        { deptName: '학과 무관', currentMembers: 0, maxMembers: 1 },
      ],
      deadline: deadlineOffsetKst(11),
    },
    {
      id: '2',
      category: '스터디',
      title: '[내 모집글 - 전체 상태 확인] 일본어 교양 수업 시험 대비 스터디원 모집',
      content:
        '이번 학기 일본어 교양 수업 같이 시험 공부할 분 구합니다! 매주 시험 범위 단어 정리하고 예상 문제 같이 풀이할 예정입니다. (우대: 주 2회 도서관 스터디룸 참여 가능자)',
      authorId: '6',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      departments: [
        { deptName: '학과 무관', currentMembers: 1, maxMembers: 3 },
        { deptName: '컴퓨터공학과', currentMembers: 0, maxMembers: 1 },
      ],
      deadline: deadlineOffsetKst(2),
    },
    {
      id: '3',
      category: '공모전',
      title: '[내 지원: 보완 요청됨] 제15회 전국 대학생 공공데이터 활용 아이디어 공모전',
      content:
        '공공데이터를 활용한 서비스 기획 공모전입니다. 전공 상관없이 아이디어 기획과 자료 조사, 프로토타입 구현에 열정 있는 분을 구합니다.',
      authorId: '2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      departments: [
        { deptName: '컴퓨터공학과', currentMembers: 0, maxMembers: 2 },
        { deptName: '학과 무관', currentMembers: 1, maxMembers: 3 },
      ],
      deadline: deadlineOffsetKst(0),
    },
    {
      id: '4',
      category: '팀플',
      title: '[내 모집글 - 정원 마감 테스트] 고급웹프로그래밍 풀스택 팀원 추가 모집',
      content:
        'React와 Node.js/Express 기반 웹 애플리케이션 제작 팀플입니다. 현재 컴퓨터공학과 1자리만 남아 있어 승인 시 자동 마감 처리 시나리오를 바로 확인할 수 있습니다.',
      authorId: '6',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
      departments: [
        { deptName: '컴퓨터공학과', currentMembers: 1, maxMembers: 2 },
        { deptName: '디자인학과', currentMembers: 1, maxMembers: 1 },
      ],
      deadline: deadlineOffsetKst(9),
    },
    {
      id: '5',
      category: '스터디',
      title: '[내 지원: 대기중] 알고리즘 코딩테스트 주 2회 문제풀이 스터디',
      content:
        '매주 화/목 오후 8시에 백준 골드~플래티넘 및 프로그래머스 Lv.2~3 문제를 함께 풀고 코드 리뷰를 진행하는 스터디입니다.',
      authorId: '5',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      departments: [
        { deptName: '컴퓨터공학과', currentMembers: 1, maxMembers: 4 },
      ],
      deadline: deadlineOffsetKst(3),
    },
    {
      id: '6',
      category: '팀플',
      title: '[내 지원: 승인됨] 교내 캠퍼스 서비스 UI/UX 리디자인 및 웹 구현 프로젝트',
      content:
        '교내 학생회 및 동아리 홍보 플랫폼을 리디자인하고 실제 웹으로 배포하는 학기 프로젝트입니다.',
      authorId: '1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      departments: [
        { deptName: '컴퓨터공학과', currentMembers: 1, maxMembers: 2 },
        { deptName: '디자인학과', currentMembers: 1, maxMembers: 2 },
      ],
      deadline: deadlineOffsetKst(10),
    },
    {
      id: '7',
      category: '대회',
      title: '[내 지원: 거절됨] 대학생 창업경진대회 비즈니스 모델 고도화 팀원 모집',
      content:
        '예비창업패키지 및 교내 창업경진대회 출전을 목표로 시장 분석 및 IR 자료를 함께 준비할 팀원을 찾습니다.',
      authorId: '2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      departments: [
        { deptName: '경영학과', currentMembers: 1, maxMembers: 2 },
        { deptName: '학과 무관', currentMembers: 0, maxMembers: 1 },
      ],
      deadline: deadlineOffsetKst(14),
    },
    {
      id: '8',
      category: '해커톤',
      title: '[전체 정원 마감 시나리오] 오픈소스 컨트리뷰션 단기 해커톤 팀원 모집',
      content:
        '모든 모집 부문의 정원이 100% 채워진 상태일 때 지원자 화면에서 마감 안내와 버튼 비활성화가 어떻게 표시되는지 확인하기 위한 모집글입니다.',
      authorId: '5',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      departments: [
        { deptName: '컴퓨터공학과', currentMembers: 2, maxMembers: 2 },
        { deptName: '학과 무관', currentMembers: 1, maxMembers: 1 },
      ],
      deadline: deadlineOffsetKst(-2),
    },
  ],
  applications: [
    {
      id: '1',
      postId: '1',
      applicantId: '2',
      targetDept: '학과 무관',
      message:
        '서비스 기획안 작성 및 발표 자료 제작 경험이 많습니다. 시장 조사와 기획 파트를 맡아 기여하고 싶습니다.',
      status: 'pending',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: '2',
      postId: '1',
      applicantId: '5',
      targetDept: '컴퓨터공학과',
      message:
        '프론트엔드 화면 구현과 REST API 연동 경험이 있습니다. 일정에 맞춰 성실히 참여하겠습니다.',
      status: 'pending',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: '3',
      postId: '2',
      applicantId: '5',
      targetDept: '학과 무관',
      message:
        '일본어 JLPT N3 보유 중이며, 요청해주신 대로 매주 화/목 오후 6시 이후 도서관 대면 스터디 참여 가능합니다! 단어장 제작을 맡겠습니다.',
      status: 'pending',
      feedback:
        '지원 감사합니다! 매주 화/목 오후 6시 대면 참여가 가능하신지, 현재 일본어 학습 수준이 어느 정도인지 보충 부탁드립니다.',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: '4',
      postId: '2',
      applicantId: '1',
      targetDept: '학과 무관',
      message:
        '이번 학기 같은 분반 수강 중입니다! 혼자 외우다 보니 진도가 밀려서 같이 꾸준히 공부하고 싶어 지원합니다.',
      status: 'pending',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: '5',
      postId: '2',
      applicantId: '2',
      targetDept: '컴퓨터공학과',
      message: '일본어 기출 어휘 퀴즈 웹앱을 간단히 만들어서 스터디원들과 같이 쓰고 싶습니다.',
      status: 'revision_requested',
      feedback:
        '아이디어가 정말 좋네요! 혹시 중간·기말고사 시험 범위 요약 파트도 분담이 가능하신지 지원서에 함께 적어주실 수 있을까요?',
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      processedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: '6',
      postId: '2',
      applicantId: '3',
      targetDept: '학과 무관',
      message:
        '지난 학기 일본어1 A+ 받았고, 매주 예상 문제 20문항씩 만들어 공유할 수 있습니다.',
      status: 'approved',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      processedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    },
    {
      id: '7',
      postId: '2',
      applicantId: '4',
      targetDept: '학과 무관',
      message: '온라인으로만 시험 직전 주에 1회 참여하고 싶습니다.',
      status: 'rejected',
      feedback:
        '이번 스터디는 매주 정기적인 대면 참여를 필수로 하고 있어 아쉽지만 함께하기 어렵습니다.',
      createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      processedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    },
    {
      id: '8',
      postId: '4',
      applicantId: '2',
      targetDept: '컴퓨터공학과',
      message:
        'Express 백엔드와 PostgreSQL 연동 경험이 있습니다. 남은 1자리에 합류해 백엔드 API를 맡고 싶습니다.',
      status: 'pending',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: '9',
      postId: '4',
      applicantId: '3',
      targetDept: '컴퓨터공학과',
      message:
        '프론트엔드 컴포넌트 설계와 상태 관리에 자신이 있습니다. 위 지원자(박준혁)가 승인되면 정원(2/2명)이 차서 자동 마감되는지 테스트할 수 있는 대기 지원서입니다.',
      status: 'pending',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
    {
      id: '10',
      postId: '4',
      applicantId: '5',
      targetDept: '컴퓨터공학과',
      message: '풀스택 프로젝트 경험이 다수 있어 초기 아키텍처 세팅부터 참여 가능합니다.',
      status: 'approved',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
      processedAt: new Date(Date.now() - 1000 * 60 * 350).toISOString(),
    },
    {
      id: '11',
      postId: '4',
      applicantId: '1',
      targetDept: '디자인학과',
      message: 'Figma 프로토타이핑 및 디자인 시스템 구축을 담당하겠습니다.',
      status: 'approved',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
      processedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    {
      id: '12',
      postId: '3',
      applicantId: '6',
      targetDept: '컴퓨터공학과',
      message:
        '공공데이터 Open API 연동 및 웹 대시보드 시각화 구현 경험이 있습니다. 데이터 파이프라인과 프론트엔드를 맡고 싶습니다.',
      status: 'revision_requested',
      feedback:
        '기술 스택이 저희 팀과 잘 맞네요! 혹시 사용해보신 차트 라이브러리나 배포 경험(Vercel/Render 등)이 있다면 지원 동기에 조금만 더 구체적으로 적어주실 수 있을까요?',
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      processedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: '13',
      postId: '5',
      applicantId: '6',
      targetDept: '컴퓨터공학과',
      message:
        'JavaScript와 Python으로 코딩테스트를 준비 중입니다. 매주 빠지지 않고 문제 풀이와 리뷰에 성실히 참여하겠습니다.',
      status: 'pending',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    },
    {
      id: '14',
      postId: '6',
      applicantId: '6',
      targetDept: '컴퓨터공학과',
      message:
        'React 컴포넌트 모듈화와 REST API 설계를 맡아 디자이너분들과 긴밀하게 협업하고 싶습니다.',
      status: 'approved',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      processedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: '15',
      postId: '7',
      applicantId: '6',
      targetDept: '학과 무관',
      message:
        '기술 구현 관점에서 서비스 타당성 검토와 MVP 프로토타입 제작을 도와드릴 수 있습니다.',
      status: 'rejected',
      feedback:
        '이번 라운드에서는 재무 추정 및 시장 분석 경험이 있는 기획 전담 인원을 우선 선발하게 되어 아쉽게도 모시지 못하게 되었습니다.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      processedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
  ],
  notifications: [
    {
      id: '1',
      recipientId: '6',
      postId: '2',
      applicationId: '3',
      type: 'application_resubmitted',
      title: '보완 지원서 재제출',
      message:
        "[[내 모집글 - 전체 상태 확인] 일본어 교양 수업 시험 대비 스터디원 모집] '김희서' 님이 '학과 무관' 부문 지원서를 보완하여 다시 제출했습니다.",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: '2',
      recipientId: '6',
      postId: '3',
      applicationId: '12',
      type: 'application_revision',
      title: '지원서 보완 요청',
      message:
        "[[내 지원: 보완 요청됨] 제15회 전국 대학생 공공데이터 활용 아이디어 공모전] 작성자가 '컴퓨터공학과' 부문 지원서에 대해 보완을 요청했습니다: 기술 스택이 저희 팀과 잘 맞네요! 혹시 사용해보신 차트 라이브러리나 배포 경험(Vercel/Render 등)이 있다면 지원 동기에 조금만 더 구체적으로 적어주실 수 있을까요?",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: '3',
      recipientId: '6',
      postId: '4',
      applicationId: '8',
      type: 'application_new',
      title: '신규 지원서 접수',
      message:
        "[[내 모집글 - 정원 마감 테스트] 고급웹프로그래밍 풀스택 팀원 추가 모집] '박준혁' 님이 '컴퓨터공학과' 부문에 지원했습니다.",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: '4',
      recipientId: '6',
      postId: '6',
      applicationId: '14',
      type: 'application_approved',
      title: '지원 승인 완료',
      message:
        "[[내 지원: 승인됨] 교내 캠퍼스 서비스 UI/UX 리디자인 및 웹 구현 프로젝트] '컴퓨터공학과' 부문 지원이 승인되어 팀원으로 확정되었습니다.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: '5',
      recipientId: '6',
      postId: '4',
      applicationId: '11',
      type: 'recruitment_closed',
      title: '모집 부문 정원 마감',
      message:
        "[[내 모집글 - 정원 마감 테스트] 고급웹프로그래밍 풀스택 팀원 추가 모집] '디자인학과' 부문 정원(1명)이 모두 채워져 마감이 완료되었습니다.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: '6',
      recipientId: '6',
      postId: '7',
      applicationId: '15',
      type: 'application_rejected',
      title: '지원 결과 안내 (거절)',
      message:
        "[[내 지원: 거절됨] 대학생 창업경진대회 비즈니스 모델 고도화 팀원 모집] '학과 무관' 부문 지원이 거절되었습니다. 사유: 이번 라운드에서는 재무 추정 및 시장 분석 경험이 있는 기획 전담 인원을 우선 선발하게 되어 아쉽게도 모시지 못하게 되었습니다.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: '7',
      recipientId: '1',
      postId: '1',
      applicationId: '1',
      type: 'application_new',
      title: '신규 지원서 접수',
      message:
        "[2026 대학생 AI 서비스 해커톤 팀원 모집] '박준혁' 님이 '학과 무관' 부문에 지원했습니다.",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: '8',
      recipientId: '1',
      postId: '1',
      applicationId: '2',
      type: 'application_new',
      title: '신규 지원서 접수',
      message:
        "[2026 대학생 AI 서비스 해커톤 팀원 모집] '김희서' 님이 '컴퓨터공학과' 부문에 지원했습니다.",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: '9',
      recipientId: '6',
      postId: '2',
      conversationId: '2',
      type: 'message_new',
      title: '김희서 님의 새 쪽지',
      message: '혹시 첫 모임 때 단어장 출력물도 챙겨가야 할까요?',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
  ],
  conversations: [
    {
      id: '1',
      user1Id: '1',
      user2Id: '6',
      postId: '6',
      createdAt: daysAgoAtKst(2, 14, 10),
      updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: '2',
      user1Id: '5',
      user2Id: '6',
      postId: '2',
      createdAt: daysAgoAtKst(1, 18, 10),
      updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: '3',
      user1Id: '1',
      user2Id: '2',
      postId: '1',
      createdAt: daysAgoAtKst(1, 13, 0),
      updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: '4',
      user1Id: '3',
      user2Id: '6',
      postId: '4',
      createdAt: daysAgoAtKst(1, 20, 0),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  ],
  messages: [
    {
      id: '1',
      conversationId: '1',
      senderId: '1',
      content:
        '안녕하세요 기영님! 교내 캠퍼스 서비스 리디자인 프로젝트 지원서 잘 읽어보았습니다.',
      isRead: true,
      createdAt: daysAgoAtKst(2, 14, 10),
    },
    {
      id: '2',
      conversationId: '1',
      senderId: '6',
      content:
        '안녕하세요 서연님! 승인해 주셔서 감사합니다. 첫 킥오프 회의 일정이 언제인지 여쭤봐도 될까요?',
      isRead: true,
      createdAt: daysAgoAtKst(1, 11, 20),
      updatedAt: daysAgoAtKst(1, 11, 25),
    },
    {
      id: '3',
      conversationId: '1',
      senderId: '1',
      content:
        '이번 주 금요일 오후 4시에 학생회관 3층 라운지에서 진행하려고 합니다!',
      isRead: true,
      createdAt: daysAgoAtKst(1, 15, 40),
    },
    {
      id: '4',
      conversationId: '1',
      senderId: '6',
      content: '삭제된 메시지입니다.',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      deletedAt: new Date(Date.now() - 1000 * 60 * 33).toISOString(),
    },
    {
      id: '5',
      conversationId: '1',
      senderId: '6',
      content:
        '금요일 오후 4시 학생회관 3층으로 꼭 참석하겠습니다! 혹시 미리 준비해 갈 자료가 있을까요?',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: '6',
      conversationId: '3',
      senderId: '2',
      content:
        '안녕하세요! 2026 AI 서비스 해커톤 기획 파트로 지원한 박준혁입니다.',
      isRead: true,
      createdAt: daysAgoAtKst(1, 13, 0),
    },
    {
      id: '7',
      conversationId: '3',
      senderId: '1',
      content:
        '반갑습니다 준혁님! 기획 포트폴리오 관련해서 궁금한 점이 있어 연락드렸습니다.',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: '8',
      conversationId: '2',
      senderId: '5',
      content:
        '기영님, 일본어 교양 시험 대비 스터디 지원서 보완해서 다시 제출했습니다!',
      isRead: true,
      createdAt: daysAgoAtKst(1, 18, 10),
    },
    {
      id: '9',
      conversationId: '2',
      senderId: '6',
      content:
        '네 희서님! 확인했습니다. 매주 화·목 오후 6시 도서관 스터디룸에서 뵈어요.',
      isRead: true,
      createdAt: daysAgoAtKst(1, 19, 5),
    },
    {
      id: '10',
      conversationId: '2',
      senderId: '5',
      content: '혹시 첫 모임 때 단어장 출력물도 챙겨가야 할까요?',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: '11',
      conversationId: '4',
      senderId: '3',
      content:
        '안녕하세요! 고급웹프로그래밍 팀플 지원했는데 관련 기술 스택 문의드립니다.',
      isRead: true,
      createdAt: daysAgoAtKst(1, 20, 0),
    },
    {
      id: '12',
      conversationId: '4',
      senderId: '3',
      content: '삭제된 메시지입니다.',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      deletedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    },
  ],
};

async function seedDatabase() {
  const db = require('./index');
  await db.initDatabase();

  await db.withTransaction(async (client) => {
    for (const user of seedData.users) {
      await client.query(
        `INSERT INTO users (id, student_id, name, dept, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [Number(user.id), user.studentId, user.name, user.dept, DEFAULT_PASSWORD_HASH]
      );
    }

    for (const post of seedData.posts) {
      await client.query(
        `INSERT INTO posts (id, author_id, category, title, content, deadline, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          Number(post.id),
          Number(post.authorId),
          post.category,
          post.title,
          post.content,
          post.deadline,
          post.createdAt,
        ]
      );

      for (const dept of post.departments) {
        await client.query(
          `INSERT INTO post_departments (post_id, dept_name, current_members, max_members)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (post_id, dept_name) DO NOTHING`,
          [Number(post.id), dept.deptName, dept.currentMembers, dept.maxMembers]
        );
      }
    }

    for (const app of seedData.applications) {
      await client.query(
        `INSERT INTO applications (
           id, post_id, applicant_id, target_dept, message,
           status, feedback, created_at, updated_at, processed_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          Number(app.id),
          Number(app.postId),
          Number(app.applicantId),
          app.targetDept,
          app.message,
          app.status,
          app.feedback,
          app.createdAt,
          app.updatedAt || null,
          app.processedAt || null,
        ]
      );
    }

    for (const conv of seedData.conversations) {
      await client.query(
        `INSERT INTO conversations (
           id, user1_id, user2_id, post_id, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user1_id, user2_id) DO NOTHING`,
        [
          Number(conv.id),
          Number(conv.user1Id),
          Number(conv.user2Id),
          conv.postId ? Number(conv.postId) : null,
          conv.createdAt,
          conv.updatedAt,
        ]
      );
    }

    for (const msg of seedData.messages) {
      await client.query(
        `INSERT INTO messages (
           id, conversation_id, sender_id, content, is_read, created_at, updated_at, deleted_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          Number(msg.id),
          Number(msg.conversationId),
          Number(msg.senderId),
          msg.content,
          Boolean(msg.isRead),
          msg.createdAt,
          msg.updatedAt || null,
          msg.deletedAt || null,
        ]
      );
    }

    for (const noti of seedData.notifications) {
      await client.query(
        `INSERT INTO notifications (
           id, recipient_id, post_id, application_id, conversation_id,
           type, title, message, is_read, created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          Number(noti.id),
          Number(noti.recipientId),
          noti.postId ? Number(noti.postId) : null,
          noti.applicationId ? Number(noti.applicationId) : null,
          noti.conversationId ? Number(noti.conversationId) : null,
          noti.type,
          noti.title,
          noti.message,
          noti.isRead,
          noti.createdAt,
        ]
      );
    }

    await client.query(`
      SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
      SELECT setval(pg_get_serial_sequence('posts', 'id'), COALESCE((SELECT MAX(id) FROM posts), 1));
      SELECT setval(pg_get_serial_sequence('applications', 'id'), COALESCE((SELECT MAX(id) FROM applications), 1));
      SELECT setval(pg_get_serial_sequence('notifications', 'id'), COALESCE((SELECT MAX(id) FROM notifications), 1));
      SELECT setval(pg_get_serial_sequence('conversations', 'id'), COALESCE((SELECT MAX(id) FROM conversations), 1));
      SELECT setval(pg_get_serial_sequence('messages', 'id'), COALESCE((SELECT MAX(id) FROM messages), 1));
    `);
  });
}

if (require.main === module) {
  require('dotenv').config();
  seedDatabase()
    .then(() => {
      console.log('시드 데이터 적재 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('시드 데이터 적재 실패:', error);
      process.exit(1);
    });
}

module.exports = { seedData, seedDatabase };
