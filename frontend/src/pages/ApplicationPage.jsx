import Button from "../components/common/Button";
import PostSummaryCard from "../components/application/PostSummaryCard";
import ApplicationForm from "../components/application/ApplicationForm";
import SubmittedApplicationCard from "../components/application/SubmittedApplicationCard";
import ApplicantFilterBar from "../components/application/ApplicantFilterBar";
import ApplicantCard from "../components/application/ApplicantCard";
import DevRoleToggle from "../components/application/DevRoleToggle";
import { usePostApplication } from "../hooks/usePostApplication";
import { isDeptFull } from "../utils/applicationUtils";
import styles from "./ApplicationPage.module.css";

function ApplicationPage({ postId }) {
  const {
    post,
    applications,
    currentUser,
    isAuthor,
    isAuthorMode,
    setIsAuthorMode,
    existingApp,
    showApplicationForm,
    loading,
    submitting,
    canceling,
    processingId,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
    counts,
    filteredApps,
    handleSubmitOrResubmit,
    handleCancelApplication,
    handleDecision,
  } = usePostApplication(postId);

  if (loading) {
    return (
      <main className={styles.pageWrapper}>
        <p className={styles.loadingText}>페이지를 불러오는 중입니다...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className={styles.pageWrapper}>
        <p className={styles.loadingText}>모집글 정보를 찾을 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className={styles.pageWrapper}>
      <div className={styles.pageContainer}>
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <Button as="a" href="/" variant="secondary" size="sm">
              ← 목록으로 돌아가기
            </Button>
            <span className={styles.breadcrumb}>
              모집 게시판 /{" "}
              <strong>
                {isAuthor ? "지원자 관리 및 승인" : "팀원 지원서 작성"}
              </strong>
            </span>
          </div>

          {/* 추후 로그인 병합 시 아래 DevRoleToggle 1줄만 제거 */}
          <DevRoleToggle
            isAuthorMode={isAuthorMode}
            onToggleRole={setIsAuthorMode}
          />
        </div>

        {!isAuthor ? (
          <div className={styles.applicantLayout}>
            <PostSummaryCard
              post={post}
              applications={applications}
              isAuthorMode={false}
            />
            {showApplicationForm ? (
              <ApplicationForm
                post={post}
                currentUser={currentUser}
                existingApplication={existingApp}
                submitting={submitting}
                canceling={canceling}
                onSubmit={handleSubmitOrResubmit}
                onCancel={handleCancelApplication}
              />
            ) : (
              <SubmittedApplicationCard
                application={existingApp}
                canceling={canceling}
                onCancel={handleCancelApplication}
              />
            )}
          </div>
        ) : (
          <div className={styles.authorLayout}>
            <PostSummaryCard
              post={post}
              applications={applications}
              isAuthorMode={true}
            />

            <ApplicantFilterBar
              counts={counts}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              deptFilter={deptFilter}
              onDeptFilterChange={setDeptFilter}
              departments={post.departments}
            />

            {filteredApps.length === 0 ? (
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
                {filteredApps.map((app) => {
                  const targetDeptObj = post.departments.find(
                    (d) => d.deptName === app.targetDept
                  );
                  const isTargetDeptFull = isDeptFull(targetDeptObj);

                  return (
                    <ApplicantCard
                      key={app.id}
                      application={app}
                      isTargetDeptFull={isTargetDeptFull}
                      processing={processingId === app.id}
                      onDecision={handleDecision}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default ApplicationPage;
