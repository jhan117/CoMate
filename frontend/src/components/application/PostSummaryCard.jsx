import Callout from "../common/Callout";
import { APPLICATION_STATUS } from "../../constants/applicationConstants";
import { isDeptFull } from "../../utils/applicationUtils";
import styles from "./PostSummaryCard.module.css";

function DeptQuotaItem({ dept, applicantCount, isAuthorMode }) {
  const isFull = isDeptFull(dept);
  const ratio = Math.min(
    100,
    Math.round((dept.currentMembers / dept.maxMembers) * 100)
  );

  if (isAuthorMode) {
    return (
      <div
        className={`${styles.bannerQuotaCard} ${
          isFull ? styles.bannerQuotaCardFull : ""
        }`}
      >
        <div className={styles.bannerQuotaTop}>
          <span className={styles.deptName}>{dept.deptName}</span>
          <span
            className={`${styles.stateBadge} ${
              isFull ? styles.stateFull : styles.stateOpen
            }`}
          >
            {isFull ? "마감" : "모집중"}
          </span>
        </div>

        <div className={styles.bannerQuotaBottom}>
          <span className={styles.bannerQuotaCount}>
            <strong>{dept.currentMembers}</strong> / {dept.maxMembers}명
          </span>
          <span className={styles.applicantCountPill}>
            지원 현황 {applicantCount}명
          </span>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${
              isFull ? styles.progressFillFull : ""
            }`}
            style={{ width: `${ratio}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <li className={styles.sidebarQuotaItem}>
      <div className={styles.sidebarQuotaTop}>
        <span className={styles.deptName}>{dept.deptName}</span>
        <div className={styles.sidebarQuotaNumbers}>
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
  const pendingCount = applications.filter(
    (a) => a.status === APPLICATION_STATUS.PENDING
  ).length;
  const totalCurrent = post.departments.reduce(
    (sum, d) => sum + d.currentMembers,
    0
  );
  const totalMax = post.departments.reduce((sum, d) => sum + d.maxMembers, 0);

  const quotaItems = post.departments.map((dept) => {
    const deptApplicantCount = applications.filter(
      (a) => a.targetDept === dept.deptName
    ).length;

    return (
      <DeptQuotaItem
        key={dept.deptName}
        dept={dept}
        applicantCount={deptApplicantCount}
        isAuthorMode={isAuthorMode}
      />
    );
  });

  if (!isAuthorMode) {
    return (
      <aside className={styles.sidebarCard}>
        <div className={styles.sidebarBadgeRow}>
          <span className={styles.categoryBadge}>{post.category}</span>
          <span className={styles.deadlineText}>마감일: {post.deadline}</span>
        </div>

        <h2 className={styles.sidebarTitle}>{post.title}</h2>
        <p className={styles.sidebarAuthor}>
          모집 팀장: <strong>{post.author}</strong>
        </p>

        {post.content && (
          <div className={styles.contentSection}>
            <Callout variant="neutralBordered" title="모집 상세 안내">
              {post.content}
            </Callout>
          </div>
        )}

        <div className={styles.quotaSection}>
          <div className={styles.quotaSectionHeader}>
            <h4 className={styles.subTitle}>모집 부문 및 인원 현황</h4>
            <span className={styles.totalSupportTag}>
              총 지원 현황 {applications.length}명
            </span>
          </div>
          <ul className={styles.sidebarQuotaList}>{quotaItems}</ul>
        </div>
      </aside>
    );
  }

  return (
    <section className={styles.bannerCard}>
      <div className={styles.bannerHeader}>
        <div className={styles.bannerTitleArea}>
          <div className={styles.bannerBadgeRow}>
            <span className={styles.categoryBadge}>{post.category}</span>
            <span className={styles.recruitSummaryBadge}>
              모집 인원 {totalCurrent} / {totalMax}명
            </span>
          </div>
          <h2 className={styles.bannerTitle}>{post.title}</h2>
          <p className={styles.bannerMeta}>
            작성자: <strong>{post.author}</strong> · 마감일: {post.deadline}
          </p>
        </div>

        <div className={styles.statBoxGroup}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>총 지원 현황</span>
            <strong className={styles.statCount}>{applications.length}명</strong>
          </div>
          <div className={styles.statBoxAccent}>
            <span className={styles.statLabelAccent}>검토 대기중</span>
            <strong className={styles.statCountAccent}>{pendingCount}명</strong>
          </div>
        </div>
      </div>

      <div className={styles.bannerQuotaGrid}>{quotaItems}</div>
    </section>
  );
}

export default PostSummaryCard;
