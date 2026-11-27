import { useEffect, useState } from "react";
import Button from "../components/common/Button";
import SubPageTopBar from "../components/common/SubPageTopBar";
import PostSummaryCard from "../components/application/PostSummaryCard";
import ApplicationForm from "../components/application/ApplicationForm";
import SubmittedApplicationCard from "../components/application/SubmittedApplicationCard";
import ApplicantFilterBar from "../components/application/ApplicantFilterBar";
import ApplicantCard from "../components/application/ApplicantCard";
import Callout from "../components/common/Callout";
import { NOTIFICATION_EVENTS } from "../constants/notificationConstants";
import { usePostApplication } from "../hooks/usePostApplication";
import { getDeadlineMeta, isDeptFull } from "../utils/applicationUtils";
import styles from "./ApplicationPage.module.css";

function ApplicationPage({ postId }) {
  const [mobileTab, setMobileTab] = useState("work");
  const [prevHighlightedAppId, setPrevHighlightedAppId] = useState(null);
  const {
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
    filters,
    actions,
  } = usePostApplication(postId);

  if (highlightedAppId !== prevHighlightedAppId) {
    setPrevHighlightedAppId(highlightedAppId);
    if (highlightedAppId && mobileTab !== "work") {
      setMobileTab("work");
    }
  }

  useEffect(() => {
    const handleRefresh = () => {
      setMobileTab("work");
    };

    window.addEventListener(
      NOTIFICATION_EVENTS.APPLICATION_PAGE_REFRESH,
      handleRefresh
    );
    return () => {
      window.removeEventListener(
        NOTIFICATION_EVENTS.APPLICATION_PAGE_REFRESH,
        handleRefresh
      );
    };
  }, []);

  if (loading) {
    return (
      <main className={styles.pageWrapper}>
        <p className={styles.loadingText}>페이지를 불러오는 중입니다...</p>
      </main>
    );
  }

  if (errorStatus === 401) {
    return (
      <main className={styles.pageWrapper}>
        <div className={styles.pageContainer}>
          <SubPageTopBar currentLabel="팀원 지원 및 관리" />

          <div className={styles.loginRequiredCard}>
            <Callout variant="neutralBordered" title="로그인이 필요한 서비스입니다">
              지원서를 제출하거나 지원 현황을 확인하려면 상단의 &apos;로그인&apos; 버튼으로 로그인해 주세요. 로그인하면 이 페이지에서 바로 이어서 이용할 수 있습니다.
            </Callout>
          </div>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className={styles.pageWrapper}>
        <p className={styles.loadingText}>
          {error || "모집글 정보를 찾을 수 없습니다."}
        </p>
      </main>
    );
  }

  const isDeadlineClosed = getDeadlineMeta(post.deadline).isClosed;
  const workTabLabel = isAuthor
    ? `지원자 관리 (${applications.length})`
    : isDeadlineClosed && !existingApp
      ? "모집 마감 안내"
      : existingApp && !showApplicationForm
        ? "내 지원 현황"
        : "지원서 작성";
  const mobileLayoutClass =
    mobileTab === "info" ? styles.showInfoMobile : styles.showWorkMobile;

  const topBarLabel = isAuthor
    ? "지원자 관리 및 승인"
    : isDeadlineClosed && !existingApp
      ? "모집 현황 보기"
      : "팀원 지원서 작성";

  return (
    <main className={styles.pageWrapper}>
      <div className={styles.pageContainer}>
        <SubPageTopBar currentLabel={topBarLabel} />

        {feedbackBanner && (
          <div role="status">
            <Callout
              variant={feedbackBanner.type === "error" ? "danger" : "success"}
              onClose={actions.clearFeedback}
            >
              {feedbackBanner.message}
            </Callout>
          </div>
        )}

        {currentUser && (
          <div className={styles.mobileTabBar} role="tablist" aria-label="화면 전환">
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === "work"}
              className={`${styles.mobileTabBtn} ${
                mobileTab === "work" ? styles.mobileTabActive : ""
              }`}
              onClick={() => setMobileTab("work")}
            >
              {workTabLabel}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === "info"}
              className={`${styles.mobileTabBtn} ${
                mobileTab === "info" ? styles.mobileTabActive : ""
              }`}
              onClick={() => setMobileTab("info")}
            >
              모집글 정보
            </button>
          </div>
        )}

        {!currentUser ? (
          <div className={styles.loginRequiredCard}>
            <Callout variant="neutralBordered" title="로그인이 필요한 서비스입니다">
              지원서를 제출하거나 지원 현황을 확인하려면 상단의 &apos;로그인&apos; 버튼으로 로그인해 주세요. 로그인하면 이 페이지에서 바로 이어서 이용할 수 있습니다.
            </Callout>
          </div>
        ) : (
          <div className={`${styles.splitLayout} ${mobileLayoutClass}`}>
            <div className={styles.infoPane}>
              <PostSummaryCard
                key={`${post.id}-${isAuthor ? "author" : "applicant"}`}
                post={post}
                applications={applications}
                isAuthorMode={isAuthor}
              />
            </div>

            <div className={styles.workPane}>
              {!isAuthor ? (
                isDeadlineClosed && !existingApp ? (
                  <div className={styles.closedNoticeCard}>
                    <Callout
                      variant="neutralBordered"
                      title="모집이 마감된 글입니다"
                    >
                      모집 마감일({post.deadline})이 지나 현재 새로운 지원서를 제출할 수 없습니다.
                    </Callout>
                    <div className={styles.closedNoticeActions}>
                      <Button as="a" href="/" variant="secondary" size="md">
                        ← 목록으로 돌아가기
                      </Button>
                    </div>
                  </div>
                ) : showApplicationForm ? (
                  <ApplicationForm
                    key={`${post.id}-${existingApp?.id ?? "new"}-${existingApp?.status ?? ""}`}
                    post={post}
                    currentUser={currentUser}
                    existingApplication={existingApp}
                    submitting={actions.submitting}
                    onSubmit={actions.submit}
                    onCancelRevision={actions.cancelRevisionEdit}
                  />
                ) : (
                  <SubmittedApplicationCard
                    application={existingApp}
                    isDeadlineClosed={isDeadlineClosed}
                    canceling={actions.canceling}
                    onCancel={actions.cancel}
                    onStartRevision={actions.startRevisionEdit}
                  />
                )
              ) : (
                <>
                  <ApplicantFilterBar
                    counts={filters.counts}
                    statusFilter={filters.status}
                    onStatusFilterChange={filters.setStatus}
                    deptFilter={filters.dept}
                    onDeptFilterChange={filters.setDept}
                    departments={post.departments}
                  />

                  {filters.list.length === 0 ? (
                    <div className={styles.emptyBox}>
                      <p className={styles.emptyTitle}>
                        해당 조건의 지원자가 없습니다.
                      </p>
                      <p className={styles.emptySub}>
                        지원자가 지원서를 제출하면 이곳에서 확인하고 승인, 보완 요청 또는 거절할 수 있습니다.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.applicantList}>
                      {filters.list.map((app) => {
                        const targetDeptObj = post.departments.find(
                          (d) => d.deptName === app.targetDept
                        );
                        const isTargetDeptFull = isDeptFull(targetDeptObj);

                        return (
                          <ApplicantCard
                            key={app.id}
                            application={app}
                            isTargetDeptFull={isTargetDeptFull}
                            processing={actions.processingId === app.id}
                            highlighted={highlightedAppId === app.id}
                            onDecision={actions.decide}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default ApplicationPage;
