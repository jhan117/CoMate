const applicationModel = require('../models/applicationModel');
const notificationModel = require('../models/notificationModel');

const applicationController = {
  // 1. 특정 모집글의 지원 페이지 데이터 조회 (GET /api/applications?postId=1)
  getApplicationsByPost(req, res) {
    const { postId } = req.query;
    if (!postId) {
      return res.status(400).json({ message: 'postId 파라미터가 필요합니다.' });
    }

    const post = applicationModel.findPostById(postId);
    if (!post) {
      return res.status(404).json({ message: '모집글을 찾을 수 없습니다.' });
    }

    const applications = applicationModel.findByPostId(postId);
    const sessionUser = req.session?.user?.id
      ? applicationModel.findUserById(req.session.user.id)
      : null;

    return res.json({
      post,
      applications,
      sessionUser,
    });
  },

  // 2. 지원서 제출 (POST /api/applications)
  createApplication(req, res) {
    const { postId, targetDept, message } = req.body;
    const applicantId = req.session?.user?.id || req.body?.applicantId;

    if (!applicantId) {
      return res.status(401).json({ message: '로그인이 필요한 기능입니다.' });
    }

    if (!postId || !targetDept || !message) {
      return res.status(400).json({
        message: '지원 부문과 지원 동기는 필수 입력 항목입니다.',
      });
    }

    const post = applicationModel.findPostById(postId);
    if (!post) {
      return res.status(404).json({ message: '존재하지 않는 모집글입니다.' });
    }

    const user = applicationModel.findUserById(applicantId);
    if (!user) {
      return res.status(404).json({ message: '지원자 회원 정보를 찾을 수 없습니다.' });
    }

    if (post.authorId === user.id) {
      return res.status(400).json({ message: '본인이 작성한 모집글에는 지원할 수 없습니다.' });
    }

    const existingApp = applicationModel.findByPostAndApplicant(postId, user.id);
    if (existingApp) {
      if (existingApp.status === 'rejected') {
        return res.status(403).json({
          message: '거절된 모집글에는 다시 지원할 수 없습니다.',
        });
      }
      return res.status(409).json({ message: '이미 이 모집글에 지원서를 제출하셨습니다.' });
    }

    const dept = post.departments.find((d) => d.deptName === targetDept);
    if (!dept) {
      return res.status(400).json({ message: '선택한 모집 부문을 찾을 수 없습니다.' });
    }
    if (dept.currentMembers >= dept.maxMembers) {
      return res.status(400).json({
        message: `'${targetDept}' 부문은 이미 모집 정원이 마감되었습니다.`,
      });
    }

    const newApplication = applicationModel.create({
      postId,
      user,
      targetDept,
      message,
    });

    notificationModel.create({
      recipientId: post.authorId,
      postId: post.id,
      applicationId: newApplication.id,
      type: 'application_new',
      title: '신규 지원서 접수',
      message: `[${post.title}] '${user.name}' 님이 '${targetDept}' 부문에 지원했습니다.`,
    });

    return res.status(201).json({
      message: '지원서가 제출되었습니다.',
      application: newApplication,
    });
  },

  // 3. 보완 요청받은 지원서 수정 재제출 (PUT /api/applications/:id)
  resubmitApplication(req, res) {
    const { targetDept, message } = req.body;
    const sessionUserId = req.session?.user?.id;

    if (!targetDept || !message) {
      return res.status(400).json({
        message: '지원 부문과 지원 동기를 모두 입력해 주세요.',
      });
    }

    const application = applicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }

    if (sessionUserId && application.applicantId !== sessionUserId) {
      return res.status(403).json({ message: '본인의 지원서만 수정할 수 있습니다.' });
    }

    if (application.status !== 'revision_requested') {
      return res.status(400).json({
        message: '보완 요청 상태인 지원서만 수정하여 다시 제출할 수 있습니다.',
      });
    }

    const post = applicationModel.findPostById(application.postId);
    if (!post) {
      return res.status(404).json({ message: '연결된 모집글을 찾을 수 없습니다.' });
    }

    const dept = post.departments.find((d) => d.deptName === targetDept);
    if (!dept) {
      return res.status(400).json({ message: '선택한 모집 부문을 찾을 수 없습니다.' });
    }
    if (dept.currentMembers >= dept.maxMembers) {
      return res.status(400).json({
        message: `'${targetDept}' 부문은 이미 모집 정원이 마감되었습니다.`,
      });
    }

    const updatedApplication = applicationModel.resubmit(application.id, {
      targetDept,
      message,
    });

    notificationModel.create({
      recipientId: post.authorId,
      postId: post.id,
      applicationId: updatedApplication.id,
      type: 'application_resubmitted',
      title: '보완 지원서 재제출',
      message: `[${post.title}] '${updatedApplication.applicantName}' 님이 '${targetDept}' 부문 지원서를 보완하여 다시 제출했습니다.`,
    });

    return res.json({
      message: '보완된 지원서가 다시 제출되었습니다.',
      application: updatedApplication,
    });
  },

  // 4. 지원 승인 / 보완 요청 / 거절 처리 (PATCH /api/applications/:id/status)
  updateApplicationStatus(req, res) {
    const { status, feedback } = req.body;
    const sessionUserId = req.session?.user?.id;

    if (!['approved', 'revision_requested', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '유효하지 않은 상태 값입니다.' });
    }

    if (
      (status === 'revision_requested' || status === 'rejected') &&
      (!feedback || !String(feedback).trim())
    ) {
      return res.status(400).json({
        message:
          status === 'revision_requested'
            ? '보완 요청 내용을 입력해 주세요.'
            : '거절 사유를 입력해 주세요.',
      });
    }

    const application = applicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }

    const post = applicationModel.findPostById(application.postId);
    if (!post) {
      return res.status(404).json({ message: '연결된 모집글을 찾을 수 없습니다.' });
    }

    if (sessionUserId && post.authorId !== sessionUserId) {
      return res.status(403).json({ message: '모집글 작성자만 지원서를 처리할 수 있습니다.' });
    }

    if (application.status === 'approved' || application.status === 'rejected') {
      return res.status(400).json({
        message: `이미 ${application.status === 'approved' ? '승인' : '거절'} 확정된 지원서입니다.`,
      });
    }

    let updatedPost = post;
    let isDeptNowClosed = false;
    let closedDept = null;

    if (status === 'approved') {
      const incrementResult = applicationModel.incrementPostDeptMember(
        post.id,
        application.targetDept
      );

      if (incrementResult.error === 'DEPT_NOT_FOUND') {
        return res.status(400).json({ message: '지원 부문 정보를 찾을 수 없습니다.' });
      }
      if (incrementResult.error === 'DEPT_FULL') {
        return res.status(400).json({
          message: `'${incrementResult.dept.deptName}' 부문의 모집 정원(${incrementResult.dept.maxMembers}명)이 이미 마감되었습니다.`,
        });
      }

      updatedPost = incrementResult.post;
      closedDept = incrementResult.dept;
      isDeptNowClosed = closedDept.currentMembers >= closedDept.maxMembers;
    }

    const updatedApplication = applicationModel.updateStatus(application.id, {
      status,
      feedback: status === 'approved' ? '' : feedback,
    });

    if (status === 'approved') {
      notificationModel.create({
        recipientId: updatedApplication.applicantId,
        postId: post.id,
        applicationId: updatedApplication.id,
        type: 'application_approved',
        title: '지원 승인 완료',
        message: `[${post.title}] '${updatedApplication.targetDept}' 부문 지원이 승인되어 팀원으로 확정되었습니다.`,
      });

      if (isDeptNowClosed && closedDept) {
        const autoRejectedApps = applicationModel.autoRejectPendingByDept(
          post.id,
          closedDept.deptName,
          updatedApplication.id,
          '해당 모집 부문의 정원이 마감되어 자동으로 거절 처리되었습니다.'
        );

        autoRejectedApps.forEach((rejectedApp) => {
          notificationModel.create({
            recipientId: rejectedApp.applicantId,
            postId: post.id,
            applicationId: rejectedApp.id,
            type: 'recruitment_closed',
            title: '모집 정원 마감 안내',
            message: `[${post.title}] 지원하신 '${closedDept.deptName}' 부문의 모집 정원이 마감되어 지원이 자동 마감 처리되었습니다.`,
          });
        });

        notificationModel.create({
          recipientId: post.authorId,
          postId: post.id,
          applicationId: updatedApplication.id,
          type: 'recruitment_closed',
          title: '모집 부문 정원 마감',
          message: `[${post.title}] '${closedDept.deptName}' 부문 정원(${closedDept.maxMembers}명)이 모두 채워져 마감이 완료되었습니다.${
            autoRejectedApps.length > 0
              ? ` (대기중 지원자 ${autoRejectedApps.length}명 자동 마감 처리)`
              : ''
          }`,
        });
      }
    } else if (status === 'revision_requested') {
      notificationModel.create({
        recipientId: updatedApplication.applicantId,
        postId: post.id,
        applicationId: updatedApplication.id,
        type: 'application_revision',
        title: '지원서 보완 요청',
        message: `[${post.title}] 작성자가 '${updatedApplication.targetDept}' 부문 지원서에 대해 보완을 요청했습니다: ${String(feedback).trim()}`,
      });
    } else if (status === 'rejected') {
      notificationModel.create({
        recipientId: updatedApplication.applicantId,
        postId: post.id,
        applicationId: updatedApplication.id,
        type: 'application_rejected',
        title: '지원 결과 안내 (거절)',
        message: `[${post.title}] '${updatedApplication.targetDept}' 부문 지원이 거절되었습니다. 사유: ${String(feedback).trim()}`,
      });
    }

    return res.json({
      message:
        status === 'approved'
          ? '지원을 승인했습니다.'
          : status === 'revision_requested'
            ? '지원자에게 보완을 요청했습니다.'
            : '지원을 거절했습니다.',
      application: updatedApplication,
      applications: applicationModel.findByPostId(post.id),
      post: updatedPost,
    });
  },

  // 5. 지원 취소 (DELETE /api/applications/:id)
  cancelApplication(req, res) {
    const sessionUserId = req.session?.user?.id;
    const application = applicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }

    if (sessionUserId && application.applicantId !== sessionUserId) {
      return res.status(403).json({ message: '본인의 지원서만 취소할 수 있습니다.' });
    }

    if (application.status === 'approved' || application.status === 'rejected') {
      return res.status(400).json({
        message: '이미 승인 또는 거절된 지원서는 취소할 수 없습니다.',
      });
    }

    applicationModel.removeById(application.id);
    return res.json({ message: '지원이 취소되었습니다.' });
  },
};

module.exports = applicationController;
