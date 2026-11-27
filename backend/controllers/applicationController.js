const applicationModel = require('../models/applicationModel');
const notificationModel = require('../models/notificationModel');

const { cleanText, isIntegerId } = require('../utils/validation');
const { emitToUser } = require('../socket');

function isDeadlinePassed(deadline) {
  if (!deadline) return false;
  const todayKst = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
  }).format(new Date());
  return String(deadline) < todayKst;
}

const applicationController = {
  // 0. 로그인한 사용자의 내 모집글 / 내 지원 현황 요약 조회 (GET /api/applications/overview)
  async getMyApplicationOverview(req, res) {
    const sessionUserId = req.userId;
    const [myPosts, myApplications] = await Promise.all([
      applicationModel.findPostsByAuthorId(sessionUserId),
      applicationModel.findByApplicantId(sessionUserId),
    ]);

    return res.status(200).json({
      myPosts,
      myApplications,
    });
  },

  // 1. 특정 모집글의 지원 페이지 데이터 조회 (GET /api/applications?postId=...)
  async getApplicationsByPost(req, res) {
    const postId = cleanText(req.query.postId);
    const sessionUserId = req.userId;

    if (!postId) {
      return res
        .status(400)
        .json({ message: '조회할 모집글 정보가 필요합니다.' });
    }
    if (!isIntegerId(postId)) {
      return res.status(404).json({ message: '모집글을 찾을 수 없습니다.' });
    }

    const post = await applicationModel.findPostById(postId);
    if (!post) {
      return res.status(404).json({ message: '모집글을 찾을 수 없습니다.' });
    }

    let applications = [];
    if (post.authorId === sessionUserId) {
      applications = await applicationModel.findByPostId(postId);
    } else {
      const myApplication = await applicationModel.findByPostAndApplicant(
        postId,
        sessionUserId
      );
      applications = myApplication ? [myApplication] : [];
    }

    return res.status(200).json({
      post,
      applications,
      sessionUser: req.user,
    });
  },

  // 1-2. 단건 지원서 상세 조회 (GET /api/applications/:id)
  async getApplicationById(req, res) {
    if (!isIntegerId(req.params.id)) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }
    const sessionUserId = req.userId;
    const application = await applicationModel.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }

    const post = await applicationModel.findPostById(application.postId);
    const isApplicant = application.applicantId === sessionUserId;
    const isPostAuthor = Boolean(post && post.authorId === sessionUserId);

    if (!isApplicant && !isPostAuthor) {
      return res.status(403).json({
        message: '본인의 지원서 또는 본인 모집글의 지원서만 열람할 수 있습니다.',
      });
    }

    return res.status(200).json({ application });
  },

  // 2. 지원서 제출 (POST /api/applications)
  async createApplication(req, res) {
    const postId = cleanText(req.body?.postId);
    const targetDept = cleanText(req.body?.targetDept);
    const message = cleanText(req.body?.message);
    const user = req.user;

    if (!postId || !targetDept || !message) {
      return res.status(400).json({
        message: '지원 부문과 지원 동기는 필수 입력 항목입니다.',
      });
    }

    if (message.length < 5 || message.length > 1000) {
      return res.status(400).json({
        message: '지원 동기는 5자 이상 1000자 이하로 작성해 주세요.',
      });
    }
    if (!isIntegerId(postId)) {
      return res.status(404).json({ message: '존재하지 않는 모집글입니다.' });
    }

    const post = await applicationModel.findPostById(postId);
    if (!post) {
      return res.status(404).json({ message: '존재하지 않는 모집글입니다.' });
    }

    if (post.authorId === user.id) {
      return res
        .status(400)
        .json({ message: '본인이 작성한 모집글에는 지원할 수 없습니다.' });
    }

    if (isDeadlinePassed(post.deadline)) {
      return res.status(409).json({
        message: '모집 마감일이 지나 지원할 수 없습니다.',
      });
    }

    const existingApp = await applicationModel.findByPostAndApplicant(
      postId,
      user.id
    );
    if (existingApp) {
      if (existingApp.status === 'rejected') {
        return res.status(403).json({
          message: '거절된 모집글에는 다시 지원할 수 없습니다.',
        });
      }
      return res
        .status(409)
        .json({ message: '이미 이 모집글에 지원서를 제출하셨습니다.' });
    }

    const dept = post.departments.find((d) => d.deptName === targetDept);
    if (!dept) {
      return res
        .status(400)
        .json({ message: '선택한 모집 부문을 찾을 수 없습니다.' });
    }
    if (dept.currentMembers >= dept.maxMembers) {
      return res.status(400).json({
        message: `'${targetDept}' 부문은 이미 모집 정원이 마감되었습니다.`,
      });
    }

    let newApplication;
    try {
      newApplication = await applicationModel.create({
        postId,
        user,
        targetDept,
        message,
      });
    } catch (error) {
      if (error.code === '23505') {
        return res
          .status(409)
          .json({ message: '이미 이 모집글에 지원서를 제출하셨습니다.' });
      }
      throw error;
    }

    await notificationModel.create({
      recipientId: post.authorId,
      postId: post.id,
      applicationId: newApplication.id,
      type: 'application_new',
      title: '신규 지원서 접수',
      message: `[${post.title}] '${user.name}' 님이 '${targetDept}' 부문에 지원했습니다.`,
    });
    emitToUser(post.authorId, 'notification:updated', { postId: post.id });

    const updatedPost = await applicationModel.findPostById(post.id);

    return res.status(201).json({
      message: '지원서가 제출되었습니다.',
      application: newApplication,
      post: updatedPost,
    });
  },

  // 3. 보완 요청받은 지원서 수정 재제출 (PUT /api/applications/:id)
  async resubmitApplication(req, res) {
    const targetDept = cleanText(req.body?.targetDept);
    const message = cleanText(req.body?.message);
    const sessionUserId = req.userId;

    if (!targetDept || !message) {
      return res.status(400).json({
        message: '지원 부문과 지원 동기를 모두 입력해 주세요.',
      });
    }

    if (message.length < 5 || message.length > 1000) {
      return res.status(400).json({
        message: '지원 동기는 5자 이상 1000자 이하로 작성해 주세요.',
      });
    }
    if (!isIntegerId(req.params.id)) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }

    const application = await applicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }

    if (application.applicantId !== sessionUserId) {
      return res
        .status(403)
        .json({ message: '본인의 지원서만 수정할 수 있습니다.' });
    }

    if (application.status !== 'revision_requested') {
      return res.status(400).json({
        message: '보완 요청 상태인 지원서만 수정하여 다시 제출할 수 있습니다.',
      });
    }

    const post = await applicationModel.findPostById(application.postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: '연결된 모집글을 찾을 수 없습니다.' });
    }
    if (isDeadlinePassed(post.deadline)) {
      return res.status(409).json({
        message: '모집 마감일이 지나 지원서를 다시 제출할 수 없습니다.',
      });
    }

    const dept = post.departments.find((d) => d.deptName === targetDept);
    if (!dept) {
      return res
        .status(400)
        .json({ message: '선택한 모집 부문을 찾을 수 없습니다.' });
    }
    if (dept.currentMembers >= dept.maxMembers) {
      return res.status(400).json({
        message: `'${targetDept}' 부문은 이미 모집 정원이 마감되었습니다.`,
      });
    }

    const updatedApplication = await applicationModel.resubmit(application.id, {
      targetDept,
      message,
    });
    if (!updatedApplication) {
      return res.status(409).json({
        message: '이미 처리되었거나 보완 재제출할 수 없는 지원서입니다.',
      });
    }

    await notificationModel.create({
      recipientId: post.authorId,
      postId: post.id,
      applicationId: updatedApplication.id,
      type: 'application_resubmitted',
      title: '보완 지원서 재제출',
      message: `[${post.title}] '${updatedApplication.applicantName}' 님이 '${targetDept}' 부문 지원서를 보완하여 다시 제출했습니다.`,
    });
    emitToUser(post.authorId, 'notification:updated', { postId: post.id });

    const updatedPost = await applicationModel.findPostById(post.id);

    return res.status(200).json({
      message: '보완된 지원서가 다시 제출되었습니다.',
      application: updatedApplication,
      post: updatedPost,
    });
  },

  // 4. 지원 승인 / 보완 요청 / 거절 처리 (PATCH /api/applications/:id/status)
  async updateApplicationStatus(req, res) {
    const status = cleanText(req.body?.status);
    const feedback = cleanText(req.body?.feedback);
    const sessionUserId = req.userId;

    if (feedback.length > 1000) {
      return res.status(400).json({
        message: '보완 요청 및 거절 사유는 1000자 이하로 입력해 주세요.',
      });
    }

    if (!['approved', 'revision_requested', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '유효하지 않은 상태 값입니다.' });
    }

    if (
      (status === 'revision_requested' || status === 'rejected') &&
      !feedback
    ) {
      return res.status(400).json({
        message:
          status === 'revision_requested'
            ? '보완 요청 내용을 입력해 주세요.'
            : '거절 사유를 입력해 주세요.',
      });
    }
    if (!isIntegerId(req.params.id)) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }

    const application = await applicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }

    const post = await applicationModel.findPostById(application.postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: '연결된 모집글을 찾을 수 없습니다.' });
    }

    if (post.authorId !== sessionUserId) {
      return res
        .status(403)
        .json({ message: '모집글 작성자만 지원서를 처리할 수 있습니다.' });
    }

    if (
      application.status === 'approved' ||
      application.status === 'rejected'
    ) {
      return res.status(400).json({
        message: `이미 ${application.status === 'approved' ? '승인' : '거절'} 확정된 지원서입니다.`,
      });
    }

    let isDeptNowClosed = false;
    let closedDept = null;
    let updatedApplication = null;

    if (status === 'approved') {
      const approveResult = await applicationModel.approveApplication(
        application.id,
        post.id
      );

      if (approveResult.error === 'APP_NOT_FOUND') {
        return res
          .status(404)
          .json({ message: '지원서를 찾을 수 없습니다.' });
      }
      if (approveResult.error === 'ALREADY_PROCESSED') {
        return res.status(409).json({
          message: `이미 ${approveResult.status === 'approved' ? '승인' : '거절'} 확정된 지원서입니다.`,
        });
      }
      if (approveResult.error === 'DEPT_NOT_FOUND') {
        return res
          .status(400)
          .json({ message: '지원 부문 정보를 찾을 수 없습니다.' });
      }
      if (approveResult.error === 'DEPT_FULL') {
        return res.status(400).json({
          message: `'${approveResult.dept.deptName}' 부문의 모집 정원(${approveResult.dept.maxMembers}명)이 이미 마감되었습니다.`,
        });
      }

      closedDept = approveResult.dept;
      isDeptNowClosed = closedDept.currentMembers >= closedDept.maxMembers;
      updatedApplication = approveResult.application;
    } else {
      updatedApplication = await applicationModel.updateStatus(
        application.id,
        { status, feedback }
      );
    }

    if (status === 'approved') {
      await notificationModel.create({
        recipientId: updatedApplication.applicantId,
        postId: post.id,
        applicationId: updatedApplication.id,
        type: 'application_approved',
        title: '지원 승인 완료',
        message: `[${post.title}] '${updatedApplication.targetDept}' 부문 지원이 승인되어 팀원으로 확정되었습니다.`,
      });
      emitToUser(updatedApplication.applicantId, 'notification:updated', {
        postId: post.id,
      });

      if (isDeptNowClosed && closedDept) {
        const autoRejectedApps =
          await applicationModel.autoRejectPendingByDept(
            post.id,
            closedDept.deptName,
            updatedApplication.id,
            '해당 모집 부문의 정원이 마감되어 자동으로 거절 처리되었습니다.'
          );

        for (const rejectedApp of autoRejectedApps) {
          await notificationModel.create({
            recipientId: rejectedApp.applicantId,
            postId: post.id,
            applicationId: rejectedApp.id,
            type: 'recruitment_closed',
            title: '모집 정원 마감 안내',
            message: `[${post.title}] 지원하신 '${closedDept.deptName}' 부문의 모집 정원이 마감되어 지원이 자동 마감 처리되었습니다.`,
          });
          emitToUser(rejectedApp.applicantId, 'notification:updated', {
            postId: post.id,
          });
        }

        await notificationModel.create({
          recipientId: post.authorId,
          postId: post.id,
          applicationId: updatedApplication.id,
          type: 'recruitment_closed',
          title: '모집 부문 정원 마감',
          message: `[${post.title}] '${closedDept.deptName}' 부문 정원(${closedDept.maxMembers}명)이 모두 채워져 마감이 완료되었습니다.${autoRejectedApps.length > 0
            ? ` (대기중 지원자 ${autoRejectedApps.length}명 자동 마감 처리)`
            : ''
            }`,
        });
        emitToUser(post.authorId, 'notification:updated', { postId: post.id });
      }
    } else if (status === 'revision_requested') {
      await notificationModel.create({
        recipientId: updatedApplication.applicantId,
        postId: post.id,
        applicationId: updatedApplication.id,
        type: 'application_revision',
        title: '지원서 보완 요청',
        message: `[${post.title}] 작성자가 '${updatedApplication.targetDept}' 부문 지원서에 대해 보완을 요청했습니다: ${feedback}`,
      });
      emitToUser(updatedApplication.applicantId, 'notification:updated', {
        postId: post.id,
      });
    } else if (status === 'rejected') {
      await notificationModel.create({
        recipientId: updatedApplication.applicantId,
        postId: post.id,
        applicationId: updatedApplication.id,
        type: 'application_rejected',
        title: '지원 결과 안내 (거절)',
        message: `[${post.title}] '${updatedApplication.targetDept}' 부문 지원이 거절되었습니다. 사유: ${feedback}`,
      });
      emitToUser(updatedApplication.applicantId, 'notification:updated', {
        postId: post.id,
      });
    }

    const [allApps, freshPost] = await Promise.all([
      applicationModel.findByPostId(post.id),
      applicationModel.findPostById(post.id),
    ]);

    return res.status(200).json({
      message:
        status === 'approved'
          ? '지원을 승인했습니다.'
          : status === 'revision_requested'
            ? '지원자에게 보완을 요청했습니다.'
            : '지원을 거절했습니다.',
      application: updatedApplication,
      applications: allApps,
      post: freshPost || post,
    });
  },

  // 5. 지원 취소 (DELETE /api/applications/:id)
  async cancelApplication(req, res) {
    if (!isIntegerId(req.params.id)) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }
    const sessionUserId = req.userId;
    const application = await applicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
    }

    if (application.applicantId !== sessionUserId) {
      return res
        .status(403)
        .json({ message: '본인의 지원서만 취소할 수 있습니다.' });
    }

    if (
      application.status === 'approved' ||
      application.status === 'rejected'
    ) {
      return res.status(400).json({
        message: '이미 승인 또는 거절된 지원서는 취소할 수 없습니다.',
      });
    }

    const removed = await applicationModel.removeById(application.id);
    if (!removed) {
      return res.status(409).json({
        message: '이미 처리되었거나 취소할 수 없는 지원서입니다.',
      });
    }
    const updatedPost = await applicationModel.findPostById(application.postId);

    return res.status(200).json({
      message: '지원이 취소되었습니다.',
      post: updatedPost,
    });
  },
};

module.exports = applicationController;
