import { useState } from "react";
import Callout from "../common/Callout";
import MessageIconLink from "../common/MessageIconLink";
import { APPLICATION_STATUS } from "../../constants/applicationConstants";
import { getDeadlineMeta, isDeptFull } from "../../utils/applicationUtils";
import styles from "./PostSummaryCard.module.css";

function DeptQuotaItem({ dept, applicantCount, isAuthorMode }) {
  const isFull = isDeptFull(dept);
  const ratio = Math.min(
    100,
    Math.round((dept.currentMembers / dept.maxMembers) * 100)
  );

  return (
    <li
      className={`${styles.quotaItem} ${
        isFull ? styles.quotaItemFull : ""
      }`}
    >
      <div className={styles.quotaTop}>
        <span className={styles.deptName}>{dept.deptName}</span>
        <div className={styles.quotaNumbers}>
          <span
            className={`${styles.memberRatio} ${
              isFull ? styles.memberRatioFull : ""
            }`}
          >
            {dept.currentMembers} / {dept.maxMembers}명
          </span>
          <span className={styles.applicantCountPill}>
            지원 {applicantCount}명
          </span>
          {isAuthorMode && (
            <span
              className={`${styles.stateBadge} ${
                isFull ? styles.stateFull : styles.stateOpen
              }`}
            >
              {isFull ? "마감" : "모집중"}
            </span>
          )}
        </div>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${
            isFull ? styles.progressFillFull : ""
          }`}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </li>
  );
}

function PostSummaryCard({ post, applications, isAuthorMode }) {
  const [showContent, setShowContent] = useState(!isAuthorMode);
  const deadlineMeta = getDeadlineMeta(post.deadline);

  const pendingCount = applications.filter(
    (a) => a.status === APPLICATION_STATUS.PENDING
  ).length;
  const totalCurrent = post.departments.reduce(
    (sum, d) => sum + d.currentMembers,
    0
  );
  const totalMax = post.departments.reduce((sum, d) => sum + d.maxMembers, 0);
  const totalApplicantsCount = post.totalApplicants ?? applications.length;

  return (
    <aside className={styles.sidebarCard}>
      <div className={styles.badgeRow}>
        <span className={styles.categoryBadge}>{post.category}</span>
        <div className={styles.deadlineGroup}>
          {deadlineMeta.label && (
            <span
              className={`${styles.deadlineBadge} ${styles[deadlineMeta.variant]}`}
            >
              {deadlineMeta.label}
            </span>
          )}
          <time className={styles.deadlineText} dateTime={post.deadline}>
            {post.deadline}
          </time>
        </div>
      </div>

      <h2 className={styles.title}>{post.title}</h2>

      <div className={styles.authorRow}>
        <p className={styles.author}>
          모집 팀장: <strong>{post.author}</strong>
        </p>
        {isAuthorMode ? (
          <span className={styles.recruitSummaryBadge}>
            모집 {totalCurrent} / {totalMax}명
          </span>
        ) : (
          <MessageIconLink
            recipientId={post.authorId}
            postId={post.id}
            label="팀장에게 쪽지 보내기"
          />
        )}
      </div>

      {isAuthorMode && (
        <div className={styles.statGrid}>
          <div className={styles.statChip}>
            <span className={styles.statChipLabel}>총 지원</span>
            <strong className={styles.statChipCount}>
              {applications.length}명
            </strong>
          </div>
          <div className={styles.statChipAccent}>
            <span className={styles.statChipLabelAccent}>검토 대기</span>
            <strong className={styles.statChipCountAccent}>
              {pendingCount}명
            </strong>
          </div>
        </div>
      )}

      {post.content && (
        <div className={styles.contentSection}>
          <button
            type="button"
            className={styles.contentToggleBtn}
            aria-expanded={showContent}
            onClick={() => setShowContent((prev) => !prev)}
          >
            {showContent ? "모집 상세 안내 접기 ▴" : "모집 상세 안내 보기 ▾"}
          </button>
          {showContent && (
            <div className={styles.contentBody}>
              <Callout
                variant="neutralBordered"
                title={
                  isAuthorMode ? "내가 작성한 모집 상세 안내" : "모집 상세 안내"
                }
              >
                {post.content}
              </Callout>
            </div>
          )}
        </div>
      )}

      <div className={styles.quotaSection}>
        <div className={styles.quotaSectionHeader}>
          <h4 className={styles.subTitle}>모집 부문 및 인원 현황</h4>
          <span className={styles.totalSupportTag}>
            총 지원 {totalApplicantsCount}명
          </span>
        </div>
        <ul className={styles.quotaList}>
          {post.departments.map((dept) => {
            const deptApplicantCount =
              dept.applicantCount ??
              applications.filter((a) => a.targetDept === dept.deptName).length;

            return (
              <DeptQuotaItem
                key={dept.deptName}
                dept={dept}
                applicantCount={deptApplicantCount}
                isAuthorMode={isAuthorMode}
              />
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

export default PostSummaryCard;
