import Button from "../components/common/Button";
import PostSummaryCard from "../components/application/PostSummaryCard";
import ApplicationForm from "../components/application/ApplicationForm";
import SubmittedApplicationCard from "../components/application/SubmittedApplicationCard";
import ApplicantFilterBar from "../components/application/ApplicantFilterBar";
import ApplicantCard from "../components/application/ApplicantCard";
import Callout from "../components/common/Callout";
import { usePostApplication } from "../hooks/usePostApplication";
import { isDeptFull } from "../utils/applicationUtils";
import styles from "./ApplicationPage.module.css";

function ApplicationPage({ postId }) {
  const {
    post,
    applications,
    currentUser,
    isAuthor,
    existingApp,
    showApplicationForm,
    loading,
    filters,
    actions,
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
        </div>

        {!currentUser ? (
          <div className={styles.loginRequiredCard}>
            <Callout variant="neutralBordered" title="로그인이 필요한 서비스입니다">
              지원서를 제출하거나 지원 현황을 확인하려면 먼저 로그인해 주세요.
            </Callout>
            <div style={{ marginTop: "16px" }}>
              <Button as="a" href="/" variant="primary" size="md">
                메인 화면으로 이동하여 로그인하기
              </Button>
            </div>
          </div>
        ) : !isAuthor ? (
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
                submitting={actions.submitting}
                canceling={actions.canceling}
                onSubmit={actions.submit}
                onCancel={actions.cancel}
              />
            ) : (
              <SubmittedApplicationCard
                application={existingApp}
                canceling={actions.canceling}
                onCancel={actions.cancel}
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
                      onDecision={actions.decide}
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
