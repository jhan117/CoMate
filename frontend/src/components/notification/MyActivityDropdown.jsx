import { useEffect, useState } from "react";
import { fetchMyApplicationOverview } from "../../api/applicationApi";
import StatusBadge from "../application/StatusBadge";
import Callout from "../common/Callout";
import { emitApplicationPageRefresh } from "../../constants/notificationConstants";
import { formatDate, formatRelativeTime } from "../../utils/applicationUtils";
import styles from "./NotificationDropdown.module.css";

const STORAGE_KEY_ACTIVITY_TAB = "comate:my-activity-tab";

function MyActivityDropdown({ onClose }) {
  const [tab, setTab] = useState(
    () => window.sessionStorage.getItem(STORAGE_KEY_ACTIVITY_TAB) || "author"
  );
  const [myPosts, setMyPosts] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    window.sessionStorage.setItem(STORAGE_KEY_ACTIVITY_TAB, nextTab);
  };

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchMyApplicationOverview();
        if (!active) return;
        const posts = data.myPosts || [];
        const apps = data.myApplications || [];
        setMyPosts(posts);
        setMyApplications(apps);

        const hasSavedTab = Boolean(
          window.sessionStorage.getItem(STORAGE_KEY_ACTIVITY_TAB)
        );
        if (!hasSavedTab && posts.length === 0 && apps.length > 0) {
          setTab("applicant");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "내 현황을 불러오지 못했습니다.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOverview();
    return () => {
      active = false;
    };
  }, []);

  const handleNavigate = (postId) => {
    const targetPath = `/posts/${encodeURIComponent(postId)}/application`;
    onClose();
    if (window.location.pathname === targetPath) {
      emitApplicationPageRefresh();
    } else {
      window.location.assign(targetPath);
    }
  };

  return (
    <div
      className={styles.dropdown}
      role="dialog"
      aria-label="내 모집 및 지원 현황"
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.headerTitle}>내 모집·지원 현황</h3>
        </div>
      </div>

      <div className={styles.filterTabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            tab === "author" ? styles.tabActive : ""
          }`}
          onClick={() => handleTabChange("author")}
        >
          내가 쓴 모집글 ({myPosts.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            tab === "applicant" ? styles.tabActive : ""
          }`}
          onClick={() => handleTabChange("applicant")}
        >
          내가 지원한 글 ({myApplications.length})
        </button>
      </div>

      {error && (
        <div role="alert" style={{ padding: "8px 12px 0" }}>
          <Callout
            variant="danger"
            size="compact"
            onClose={() => setError("")}
          >
            {error}
          </Callout>
        </div>
      )}

      {loading ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyDesc}>현황을 불러오는 중입니다...</p>
        </div>
      ) : tab === "author" ? (
        myPosts.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>작성한 모집글이 없습니다.</p>
            <p className={styles.emptyDesc}>
              모집글을 작성하면 들어온 지원서를 이곳에서 바로 확인하고 승인·관리할 수 있습니다.
            </p>
          </div>
        ) : (
          <ul className={styles.list}>
            {myPosts.map((post) => (
              <li
                key={post.id}
                className={styles.hubItem}
                onClick={() => handleNavigate(post.id)}
              >
                <div className={styles.hubItemTop}>
                  <span className={styles.hubCategoryBadge}>
                    {post.category}
                  </span>
                  {post.pendingCount > 0 ? (
                    <span className={styles.hubPendingBadge}>
                      검토 대기 {post.pendingCount}명
                    </span>
                  ) : (
                    <span className={styles.hubCountMeta}>
                      총 지원 {post.totalApplicants}명
                    </span>
                  )}
                </div>
                <strong className={styles.hubItemTitle}>{post.title}</strong>
                <div className={styles.hubItemBottom}>
                  <span className={styles.hubSubMeta}>
                    총 지원 {post.totalApplicants}명 · 승인 {post.approvedCount}명
                  </span>
                  <span className={styles.hubLinkHint}>지원자 관리 →</span>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : myApplications.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>제출한 지원서가 없습니다.</p>
          <p className={styles.emptyDesc}>
            관심 있는 모집글에 지원하면 진행 상태(대기·보완요청·승인·거절)를 이곳에서 모아볼 수 있습니다.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {myApplications.map((app) => (
            <li
              key={app.id}
              className={styles.hubItem}
              onClick={() => handleNavigate(app.postId)}
            >
              <div className={styles.hubItemTop}>
                <span className={styles.hubDeptTag}>
                  지원 부문: {app.targetDept}
                </span>
                <StatusBadge status={app.status} />
              </div>
              <strong className={styles.hubItemTitle}>{app.postTitle}</strong>
              <div className={styles.hubItemBottom}>
                <span
                  className={styles.hubSubMeta}
                  title={formatDate(app.updatedAt || app.createdAt)}
                >
                  {formatRelativeTime(app.updatedAt || app.createdAt)}
                </span>
                <span className={styles.hubLinkHint}>내 지원서 확인 →</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyActivityDropdown;
