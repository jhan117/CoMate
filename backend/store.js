const store = {
  users: [
    { id: 'user1', password: '123', studentId: '24100412', name: '이서연', dept: '디자인학과' },
    { id: 'user2', password: '123', studentId: '24100815', name: '박준혁', dept: '경영학과' },
    { id: 'ella', password: '123', studentId: '26000000', name: '김희서', dept: '컴퓨터공학과' },
    { id: 'kaye', password: '123', studentId: '26110091', name: '권기영', dept: '컴퓨터공학과' },
  ],
  posts: [
    {
      id: '1',
      category: '해커톤',
      title: '2026 대학생 AI 서비스 해커톤 팀원 모집',
      content:
        '교내 대표로 2026 AI 해커톤에 출전할 개발자 및 기획/디자이너 팀원을 모집합니다. 주 1회 대면 또는 온라인 회의가 가능한 분이면 좋겠습니다.',
      authorId: 'user1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      departments: [
        { deptName: '컴퓨터공학과', currentMembers: 0, maxMembers: 3 },
        { deptName: '디자인학과', currentMembers: 0, maxMembers: 2 },
        { deptName: '학과 무관', currentMembers: 0, maxMembers: 2 },
      ],
      deadline: '2026-11-30',
    },
    {
      id: '2',
      category: '스터디',
      title: '일본어 교양 수업 시험 대비 스터디원 모집',
      content:
        '이번 학기 일본어 교양 수업 같이 시험 공부할 분 구합니다! 매주 시험 범위 단어 정리하고 예상 문제 같이 풀이할 예정입니다.',
      authorId: 'kaye',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      departments: [
        { deptName: '학과 무관', currentMembers: 0, maxMembers: 3 },
      ],
      deadline: '2026-11-25',
    },
    {
      id: '3',
      category: '공모전',
      title: '제15회 전국 대학생 공공데이터 활용 아이디어 공모전',
      content:
        '공공데이터를 활용한 서비스 기획 공모전입니다. 전공 상관없이 아이디어 기획과 자료 조사에 열정 있는 분을 구합니다.',
      authorId: 'user2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      departments: [
        { deptName: '학과 무관', currentMembers: 0, maxMembers: 4 },
      ],
      deadline: '2026-12-10',
    },
  ],
  applications: [
    {
      id: 'app-1',
      postId: '1',
      applicantId: 'user2',
      targetDept: '학과 무관',
      message:
        '서비스 기획안 작성 및 발표 자료 제작 경험이 많습니다. 시장 조사와 기획 파트를 맡아 기여하고 싶습니다.',
      status: 'pending',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'app-2',
      postId: '1',
      applicantId: 'ella',
      targetDept: '컴퓨터공학과',
      message:
        '프론트엔드 화면 구현과 REST API 연동 경험이 있습니다. 일정에 맞춰 성실히 참여하겠습니다.',
      status: 'pending',
      feedback: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
  ],
  notifications: [],
};

module.exports = store;
