import { useState } from "react";
import Button from "../common/Button";
import NotificationItem from "./NotificationItem";
import styles from "./NotificationDropdown.module.css";

function NotificationDropdown({
  activeUser,
  notifications,
  unreadCount,
  onRead,
  onReadAll,
  onDelete,
  onClose,
}) {
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'

  const filteredList =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleNavigate = (targetPath) => {
    onClose();
    if (window.location.pathname !== targetPath) {
      window.location.href = targetPath;
    }
  };

  if (!activeUser) {
    return (
      <div className={styles.dropdown} role="dialog" aria-label="알림 목록">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h3 className={styles.headerTitle}>알림</h3>
          </div>
        </div>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>로그인이 필요합니다.</p>
          <p className={styles.emptyDesc}>
            로그인하면 지원서 접수, 승인/보완 요청/거절 결과 및 모집 마감 알림을 확인할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dropdown} role="dialog" aria-label="알림 목록">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.headerTitle}>알림</h3>
          <span className={styles.userTag}>{activeUser.name} 님</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={unreadCount === 0}
          onClick={onReadAll}
        >
          모두 읽음
        </Button>
      </div>

      <div className={styles.filterTabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            filter === "all" ? styles.tabActive : ""
          }`}
          onClick={() => setFilter("all")}
        >
          전체 ({notifications.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            filter === "unread" ? styles.tabActive : ""
          }`}
          onClick={() => setFilter("unread")}
        >
          안 읽음 ({unreadCount})
        </button>
      </div>

      {filteredList.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {filter === "unread"
              ? "읽지 않은 알림이 없습니다."
              : "도착한 알림이 없습니다."}
          </p>
          <p className={styles.emptyDesc}>
            지원서 접수, 승인/보완요청/거절 결과, 모집 마감 소식이 이곳에 표시됩니다.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {filteredList.map((noti) => (
            <NotificationItem
              key={noti.id}
              notification={noti}
              onRead={onRead}
              onDelete={onDelete}
              onNavigate={handleNavigate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationDropdown;
