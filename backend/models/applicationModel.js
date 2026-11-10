const store = require('../store');

const applicationModel = {
  // users 테이블(배열)과 JOIN 역할: 게시글에 작성자 이름 연결
  attachAuthor(post) {
    if (!post) return null;
    const authorUser = this.findUserById(post.authorId);
    return {
      ...post,
      author: authorUser ? authorUser.name : '알 수 없음',
    };
  },

  // users 테이블(배열)과 JOIN 역할: 지원서에 지원자 학번/이름/학과 연결
  attachApplicant(app) {
    if (!app) return null;
    const applicantUser = this.findUserById(app.applicantId);
    return {
      ...app,
      applicantStudentId: applicantUser ? applicantUser.studentId : '',
      applicantName: applicantUser ? applicantUser.name : '알 수 없음',
      applicantDept: applicantUser ? applicantUser.dept : '',
    };
  },

  findByPostId(postId) {
    return store.applications
      .filter((app) => app.postId === String(postId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((app) => this.attachApplicant(app));
  },

  findById(id) {
    const app = store.applications.find((a) => a.id === String(id)) || null;
    return this.attachApplicant(app);
  },

  findByPostAndApplicant(postId, applicantId) {
    const app =
      store.applications.find(
        (a) =>
          a.postId === String(postId) &&
          a.applicantId === String(applicantId)
      ) || null;
    return this.attachApplicant(app);
  },

  findPostById(postId) {
    const post = store.posts.find((p) => p.id === String(postId)) || null;
    return this.attachAuthor(post);
  },

  findUserById(userId) {
    const user = store.users.find((u) => u.id === String(userId));
    if (!user) return null;
    return {
      id: user.id,
      studentId: user.studentId,
      name: user.name,
      dept: user.dept,
    };
  },

  create({ postId, user, targetDept, message }) {
    const newApplication = {
      id: `app-${Date.now()}`,
      postId: String(postId),
      applicantId: user.id,
      targetDept,
      message: String(message).trim(),
      status: 'pending',
      feedback: '',
      createdAt: new Date().toISOString(),
    };

    store.applications.push(newApplication);
    return this.attachApplicant(newApplication);
  },

  resubmit(id, { targetDept, message }) {
    const application = store.applications.find((app) => app.id === String(id));
    if (!application) return null;

    application.targetDept = targetDept;
    application.message = String(message).trim();
    application.status = 'pending';
    application.feedback = '';
    application.updatedAt = new Date().toISOString();
    return this.attachApplicant(application);
  },

  updateStatus(id, { status, feedback = '' }) {
    const application = store.applications.find((app) => app.id === String(id));
    if (!application) return null;

    application.status = status;
    application.feedback = String(feedback).trim();
    application.processedAt = new Date().toISOString();
    return this.attachApplicant(application);
  },

  incrementPostDeptMember(postId, deptName) {
    const post = store.posts.find((p) => p.id === String(postId));
    if (!post) return { error: 'POST_NOT_FOUND' };

    const dept = post.departments.find((d) => d.deptName === deptName);
    if (!dept) return { error: 'DEPT_NOT_FOUND' };

    if (dept.currentMembers >= dept.maxMembers) {
      return { error: 'DEPT_FULL', dept };
    }

    dept.currentMembers += 1;
    return { post: this.attachAuthor(post), dept };
  },

  autoRejectPendingByDept(postId, deptName, excludeApplicationId, feedback) {
    const now = new Date().toISOString();
    const autoRejected = [];

    store.applications.forEach((app) => {
      if (
        app.postId === String(postId) &&
        app.targetDept === deptName &&
        app.id !== String(excludeApplicationId) &&
        app.status === 'pending'
      ) {
        app.status = 'rejected';
        app.feedback = String(feedback).trim();
        app.processedAt = now;
        autoRejected.push(this.attachApplicant(app));
      }
    });

    return autoRejected;
  },

  removeById(id) {
    const index = store.applications.findIndex((app) => app.id === String(id));
    if (index === -1) return false;
    store.applications.splice(index, 1);
    return true;
  },
};

module.exports = applicationModel;
