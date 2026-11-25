import { useCallback, useEffect, useState } from "react";
import {
  fetchPostApplicationData,
  createApplication,
  resubmitApplication,
  updateApplicationStatus,
  cancelApplication,
} from "../api/applicationApi";
import { APPLICATION_STATUS } from "../constants/applicationConstants";
import {
  NOTIFICATION_EVENTS,
  emitNotificationsUpdated,
} from "../constants/notificationConstants";

export function usePostApplication(postId, externalUser = null) {
  const [post, setPost] = useState(null);
  const [applications, setApplications] = useState([]);
  const [sessionUser, setSessionUser] = useState(null);

  const currentUser = externalUser !== null ? externalUser : sessionUser;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [feedbackBanner, setFeedbackBanner] = useState(null);
  const [isEditingRevision, setIsEditingRevision] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [highlightedAppId, setHighlightedAppId] = useState(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);

  const statusStorageKey = `comate:app-status:${postId}`;
  const deptStorageKey = `comate:app-dept:${postId}`;

  const [statusFilter, setStatusFilterState] = useState(
    () => window.sessionStorage.getItem(statusStorageKey) || "all"
  );
  const [deptFilter, setDeptFilterState] = useState(
    () => window.sessionStorage.getItem(deptStorageKey) || "all"
  );

  const setStatusFilter = useCallback(
    (nextStatus) => {
      setStatusFilterState(nextStatus);
      window.sessionStorage.setItem(statusStorageKey, nextStatus);
    },
    [statusStorageKey]
  );

  const setDeptFilter = useCallback(
    (nextDept) => {
      setDeptFilterState(nextDept);
      window.sessionStorage.setItem(deptStorageKey, nextDept);
    },
    [deptStorageKey]
  );

  const loadPageData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setErrorStatus(null);
      const data = await fetchPostApplicationData(postId);
      setPost(data.post);
      setApplications(data.applications);
      if (data.sessionUser) {
        setSessionUser(data.sessionUser);
      }
    } catch (err) {
      setError(err.message || "데이터를 불러오지 못했습니다.");
      setErrorStatus(err.status || 500);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    let active = true;

    const initPage = async () => {
      try {
        setLoading(true);
        setError("");
        setErrorStatus(null);
        const data = await fetchPostApplicationData(postId);
        if (!active) return;
        setPost(data.post);
        setApplications(data.applications);
        if (data.sessionUser) {
          setSessionUser(data.sessionUser);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || "데이터를 불러오지 못했습니다.");
        setErrorStatus(err.status || 500);
      } finally {
        if (active) setLoading(false);
      }
    };

    initPage();

    return () => {
      active = false;
    };
  }, [postId]);

  useEffect(() => {
    const handleRefresh = () => {
      setScrollTrigger((prev) => prev + 1);
      loadPageData();
    };

    const handleUserChanged = (e) => {
      const nextUser = e.detail || null;
      setSessionUser(nextUser);
      setIsEditingRevision(false);
      setFeedbackBanner(null);

      if (!nextUser) {
        setPost(null);
        setApplications([]);
        setErrorStatus(401);
        setError("지원서를 제출하거나 지원 현황을 확인하려면 먼저 로그인해 주세요.");
        return;
      }

      loadPageData();
    };

    window.addEventListener(
      NOTIFICATION_EVENTS.APPLICATION_PAGE_REFRESH,
      handleRefresh
    );
    window.addEventListener(
      NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
      handleUserChanged
    );
    return () => {
      window.removeEventListener(
        NOTIFICATION_EVENTS.APPLICATION_PAGE_REFRESH,
        handleRefresh
      );
      window.removeEventListener(
        NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
        handleUserChanged
      );
    };
  }, [loadPageData]);

  const isAuthor = Boolean(post && currentUser && currentUser.id === post.authorId);

  useEffect(() => {
    if (loading || !isAuthor || applications.length === 0) return;

    const hash = window.location.hash || "";
    if (!hash.startsWith("#application-")) return;

    const targetAppId = decodeURIComponent(hash.replace(/^#application-/, ""));
    const targetApp = applications.find((a) => a.id === targetAppId);
    if (!targetApp) return;

    const scrollTimer = window.setTimeout(() => {
      setStatusFilterState((prev) =>
        prev !== "all" && prev !== targetApp.status ? "all" : prev
      );
      setDeptFilterState((prev) =>
        prev !== "all" && prev !== targetApp.targetDept ? "all" : prev
      );
      setHighlightedAppId(targetAppId);

      window.setTimeout(() => {
        const el = document.getElementById(`application-${targetAppId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        window.history.replaceState(null, "", window.location.pathname);
      }, 60);
    }, 50);

    const clearHighlightTimer = window.setTimeout(() => {
      setHighlightedAppId((prev) => (prev === targetAppId ? null : prev));
    }, 3500);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearHighlightTimer);
    };
  }, [loading, isAuthor, applications, scrollTrigger]);

  const existingApp = currentUser
    ? applications.find((app) => app.applicantId === currentUser.id)
    : null;

  const showApplicationForm =
    !existingApp ||
    (existingApp.status === APPLICATION_STATUS.REVISION_REQUESTED &&
      isEditingRevision);

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
      setFeedbackBanner({
        type: "error",
        message: "로그인이 필요한 기능입니다.",
      });
      return;
    }
    setSubmitting(true);
    setFeedbackBanner(null);
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
        setIsEditingRevision(false);
        setFeedbackBanner({
          type: "success",
          message: data.message || "보완된 지원서가 다시 제출되었습니다.",
        });
      } else {
        const data = await createApplication({
          postId: post.id,
          targetDept,
          message,
        });
        setApplications((prev) => [data.application, ...prev]);
        if (data.post) {
          setPost(data.post);
        }
        setFeedbackBanner({
          type: "success",
          message: data.message || "지원서가 제출되었습니다.",
        });
      }
      emitNotificationsUpdated();
    } finally {
      setSubmitting(false);
    }
  };

  const cancelMyApplication = async (applicationId) => {
    setCanceling(true);
    setFeedbackBanner(null);
    try {
      const data = await cancelApplication(applicationId);
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      setIsEditingRevision(false);
      if (data?.post) {
        setPost(data.post);
      }
      setFeedbackBanner({
        type: "success",
        message: data?.message || "지원이 취소되었습니다.",
      });
    } catch (err) {
      setFeedbackBanner({
        type: "error",
        message: err.message || "지원 취소에 실패했습니다.",
      });
    } finally {
      setCanceling(false);
    }
  };

  const decideApplication = async (app, newStatus, feedback = "") => {
    setProcessingId(app.id);
    setFeedbackBanner(null);
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
      setFeedbackBanner({
        type: "success",
        message: data.message || "지원서 상태가 변경되었습니다.",
      });
      emitNotificationsUpdated();
    } catch (err) {
      setFeedbackBanner({
        type: "error",
        message: err.message || "상태 변경에 실패했습니다.",
      });
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
    error,
    errorStatus,
    feedbackBanner,
    highlightedAppId,
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
      startRevisionEdit: () => {
        setFeedbackBanner(null);
        setIsEditingRevision(true);
      },
      cancelRevisionEdit: () => setIsEditingRevision(false),
      clearFeedback: () => setFeedbackBanner(null),
      submitting,
      canceling,
      processingId,
    },
  };
}
