const applicationModel = require('../models/applicationModel');
const notificationModel = require('../models/notificationModel');

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

const applicationController = {
  // 0. 로그인한 사용자의 내 모집글 / 내 지원 현황 요약 조회 (GET /api/applications/overview)
  getMyApplicationOverview(req, res) {
    try {
      const sessionUserId = req.userId;
      const myPosts = applicationModel.findPostsByAuthorId(sessionUserId);
      const myApplications = applicationModel.findByApplicantId(sessionUserId);

      return res.status(200).json({
        myPosts,
        myApplications,
      });
    } catch (error) {
      console.error('내 모집·지원 현황 조회 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },

  // 1. 특정 모집글의 지원 페이지 데이터 조회 (GET /api/applications?postId=1)
  getApplicationsByPost(req, res) {
    try {
      const postId = cleanText(req.query.postId);
      const sessionUserId = req.userId;

      if (!postId) {
        return res.status(400).json({ message: 'postId 파라미터가 필요합니다.' });
      }

      const post = applicationModel.findPostById(postId);
      if (!post) {
        return res.status(404).json({ message: '모집글을 찾을 수 없습니다.' });
      }

      // R10 (Authorization): 작성자는 전체 지원서 조회, 일반 지원자는 본인 지원서만 조회
      let applications = [];
      if (post.authorId === sessionUserId) {
        applications = applicationModel.findByPostId(postId);
      } else {
        const myApplication = applicationModel.findByPostAndApplicant(
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
    } catch (error) {
      console.error('지원 페이지 데이터 조회 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },

  // 1-2. 단건 지원서 상세 조회 (GET /api/applications/:id)
  getApplicationById(req, res) {
    try {
      const sessionUserId = req.userId;
      const application = applicationModel.findById(req.params.id);

      if (!application) {
        return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
      }

      const post = applicationModel.findPostById(application.postId);
      const isApplicant = application.applicantId === sessionUserId;
      const isPostAuthor = Boolean(post && post.authorId === sessionUserId);

      if (!isApplicant && !isPostAuthor) {
        return res.status(403).json({
          message: '본인의 지원서 또는 본인 모집글의 지원서만 열람할 수 있습니다.',
        });
      }

      return res.status(200).json({ application });
    } catch (error) {
      console.error('단건 지원서 조회 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },

  // 2. 지원서 제출 (POST /api/applications)
  createApplication(req, res) {
    try {
      const postId = cleanText(req.body?.postId);
      const targetDept = cleanText(req.body?.targetDept);
      const message = cleanText(req.body?.message);
      // R10: applicantId는 절대 브라우저(req.body)에서 받지 않고 세션에서만 가져옴
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

      const post = applicationModel.findPostById(postId);
      if (!post) {
        return res.status(404).json({ message: '존재하지 않는 모집글입니다.' });
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
        post: applicationModel.findPostById(post.id),
      });
    } catch (error) {
      console.error('지원서 제출 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },

  // 3. 보완 요청받은 지원서 수정 재제출 (PUT /api/applications/:id)
  resubmitApplication(req, res) {
    try {
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

      const application = applicationModel.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
      }

      if (application.applicantId !== sessionUserId) {
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

      return res.status(200).json({
        message: '보완된 지원서가 다시 제출되었습니다.',
        application: updatedApplication,
      });
    } catch (error) {
      console.error('지원서 재제출 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },

  // 4. 지원 승인 / 보완 요청 / 거절 처리 (PATCH /api/applications/:id/status)
  updateApplicationStatus(req, res) {
    try {
      const status = cleanText(req.body?.status);
      const feedback = cleanText(req.body?.feedback);
      const sessionUserId = req.userId;

      if (!['approved', 'revision_requested', 'rejected'].includes(status)) {
        return res.status(400).json({ message: '유효하지 않은 상태 값입니다.' });
      }

      if ((status === 'revision_requested' || status === 'rejected') && !feedback) {
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

      if (post.authorId !== sessionUserId) {
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
          message: `[${post.title}] 작성자가 '${updatedApplication.targetDept}' 부문 지원서에 대해 보완을 요청했습니다: ${feedback}`,
        });
      } else if (status === 'rejected') {
        notificationModel.create({
          recipientId: updatedApplication.applicantId,
          postId: post.id,
          applicationId: updatedApplication.id,
          type: 'application_rejected',
          title: '지원 결과 안내 (거절)',
          message: `[${post.title}] '${updatedApplication.targetDept}' 부문 지원이 거절되었습니다. 사유: ${feedback}`,
        });
      }

      return res.status(200).json({
        message:
          status === 'approved'
            ? '지원을 승인했습니다.'
            : status === 'revision_requested'
              ? '지원자에게 보완을 요청했습니다.'
              : '지원을 거절했습니다.',
        application: updatedApplication,
        applications: applicationModel.findByPostId(post.id),
        post: applicationModel.findPostById(post.id) || updatedPost,
      });
    } catch (error) {
      console.error('지원서 상태 변경 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },

  // 5. 지원 취소 (DELETE /api/applications/:id)
  cancelApplication(req, res) {
    try {
      const sessionUserId = req.userId;
      const application = applicationModel.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
      }

      if (application.applicantId !== sessionUserId) {
        return res.status(403).json({ message: '본인의 지원서만 취소할 수 있습니다.' });
      }

      if (application.status === 'approved' || application.status === 'rejected') {
        return res.status(400).json({
          message: '이미 승인 또는 거절된 지원서는 취소할 수 없습니다.',
        });
      }

      applicationModel.removeById(application.id);
      return res.status(200).json({
        message: '지원이 취소되었습니다.',
        post: applicationModel.findPostById(application.postId),
      });
    } catch (error) {
      console.error('지원 취소 오류:', error);
      return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
  },
};

module.exports = applicationController;
