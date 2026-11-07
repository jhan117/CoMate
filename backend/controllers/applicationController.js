const applicationModel = require('../models/applicationModel');

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
    // 임시
    const { authorUser, applicantUser } = applicationModel.findTestRoleUsers(post);

    return res.json({
      post,
      applications,
      authorUser,
      applicantUser,
    });
  },

  // 2. 지원서 제출 (POST /api/applications)
  createApplication(req, res) {
    const { postId, applicantId, targetDept, message } = req.body;

    if (!postId || !applicantId || !targetDept || !message) {
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

    return res.status(201).json({
      message: '지원서가 제출되었습니다.',
      application: newApplication,
    });
  },

  // 3. 보완 요청받은 지원서 수정 재제출 (PUT /api/applications/:id)
  resubmitApplication(req, res) {
    const { targetDept, message } = req.body;
    if (!targetDept || !message) {
      return res.status(400).json({
        message: '지원 부문과 지원 동기를 모두 입력해 주세요.',
      });
    }

    const application = applicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
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

    return res.json({
      message: '보완된 지원서가 다시 제출되었습니다.',
      application: updatedApplication,
    });
  },

  // 4. 지원 승인 / 보완 요청 / 거절 처리 (PATCH /api/applications/:id/status)
  updateApplicationStatus(req, res) {
    const { status, feedback } = req.body;
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

    if (application.status === 'approved' || application.status === 'rejected') {
      return res.status(400).json({
        message: `이미 ${application.status === 'approved' ? '승인' : '거절'} 확정된 지원서입니다.`,
      });
    }

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
    }

    const updatedApplication = applicationModel.updateStatus(application.id, {
      status,
      feedback: status === 'approved' ? '' : feedback,
    });

    return res.json({
      message:
        status === 'approved'
          ? '지원을 승인했습니다.'
          : status === 'revision_requested'
            ? '지원자에게 보완을 요청했습니다.'
            : '지원을 거절했습니다.',
      application: updatedApplication,
      post,
    });
  },

  // 5. 지원 취소 (DELETE /api/applications/:id)
  cancelApplication(req, res) {
    const application = applicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '지원서를 찾을 수 없습니다.' });
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
