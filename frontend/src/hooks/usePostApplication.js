import { useEffect, useState } from "react";
import {
  fetchPostApplicationData,
  createApplication,
  resubmitApplication,
  updateApplicationStatus,
  cancelApplication,
} from "../api/applicationApi";
import { APPLICATION_STATUS } from "../constants/applicationConstants";
import {
  emitActiveUserChanged,
  emitNotificationsUpdated,
} from "../constants/notificationConstants";

export function usePostApplication(postId, externalUser = null) {
  const [post, setPost] = useState(null);
  const [applications, setApplications] = useState([]);
  const [sessionUser, setSessionUser] = useState(null);

  const currentUser = externalUser !== null ? externalUser : sessionUser;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  useEffect(() => {
    const loadPageData = async () => {
      try {
        setLoading(true);
        const data = await fetchPostApplicationData(postId);
        setPost(data.post);
        setApplications(data.applications);
        if (data.sessionUser) {
          setSessionUser(data.sessionUser);
          emitActiveUserChanged(data.sessionUser);
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [postId]);

  const isAuthor = Boolean(post && currentUser && currentUser.id === post.authorId);

  const existingApp = currentUser
    ? applications.find((app) => app.applicantId === currentUser.id)
    : null;

  const showApplicationForm =
    !existingApp || existingApp.status === APPLICATION_STATUS.REVISION_REQUESTED;

  const counts = {
    all: applications.length,
    [APPLICATION_STATUS.PENDING]: applications.filter(
      (a) => a.status === APPLICATION_STATUS.PENDING
    ).length,
    [APPLICATION_STATUS.REVISION_REQUESTED]: applications.filter(
      (a) => a.status === APPLICATION_STATUS.REVISION_REQUESTED
    ).length,
    [APPLICATION_STATUS.APPROVED]: applications.filter(
      (a) => a.status === APPLICATION_STATUS.APPROVED
    ).length,
    [APPLICATION_STATUS.REJECTED]: applications.filter(
      (a) => a.status === APPLICATION_STATUS.REJECTED
    ).length,
  };

  const filteredApps = applications.filter((app) => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (deptFilter !== "all" && app.targetDept !== deptFilter) return false;
    return true;
  });

  const submitApplication = async ({ targetDept, message }) => {
    if (!currentUser) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }
    setSubmitting(true);
    try {
      if (
        existingApp &&
        existingApp.status === APPLICATION_STATUS.REVISION_REQUESTED
      ) {
        const data = await resubmitApplication(existingApp.id, {
          targetDept,
          message,
        });
        setApplications((prev) =>
          prev.map((a) => (a.id === data.application.id ? data.application : a))
        );
      } else {
        const data = await createApplication({
          postId: post.id,
          applicantId: currentUser.id,
          targetDept,
          message,
        });
        setApplications((prev) => [data.application, ...prev]);
      }
      emitNotificationsUpdated();
    } finally {
      setSubmitting(false);
    }
  };

  const cancelMyApplication = async (applicationId) => {
    if (!window.confirm("제출한 지원서를 취소하시겠습니까?")) return;

    setCanceling(true);
    try {
      await cancelApplication(applicationId);
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    } catch (err) {
      alert(err.message);
    } finally {
      setCanceling(false);
    }
  };

  const decideApplication = async (app, newStatus, feedback = "") => {
    if (newStatus === APPLICATION_STATUS.APPROVED) {
      if (!window.confirm(`'${app.applicantName}' 님의 지원을 승인하시겠습니까?`)) {
        return;
      }
    }

    setProcessingId(app.id);
    try {
      const data = await updateApplicationStatus(app.id, newStatus, feedback);
      if (Array.isArray(data.applications)) {
        setApplications(data.applications);
      } else {
        setApplications((prev) =>
          prev.map((a) => (a.id === data.application.id ? data.application : a))
        );
      }
      if (data.post) {
        setPost(data.post);
      }
      emitNotificationsUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return {
    post,
    applications,
    currentUser,
    isAuthor,
    existingApp,
    showApplicationForm,
    loading,
    filters: {
      status: statusFilter,
      dept: deptFilter,
      setStatus: setStatusFilter,
      setDept: setDeptFilter,
      counts,
      list: filteredApps,
    },
    actions: {
      submit: submitApplication,
      cancel: cancelMyApplication,
      decide: decideApplication,
      submitting,
      canceling,
      processingId,
    },
  };
}
