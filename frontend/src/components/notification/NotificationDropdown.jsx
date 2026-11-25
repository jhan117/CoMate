import { useState } from "react";
import Button from "../common/Button";
import Callout from "../common/Callout";
import ConfirmModal from "../common/ConfirmModal";
import NotificationItem from "./NotificationItem";
import { emitApplicationPageRefresh } from "../../constants/notificationConstants";
import styles from "./NotificationDropdown.module.css";

const STORAGE_KEY_NOTI_FILTER = "comate:notification-filter";

const FILTER_LABELS = {
  all: "전체",
  unread: "안 읽음",
};

function NotificationDropdown({
  activeUser,
  notifications,
  unreadCount,
  error = "",
  onRead,
  onReadAll,
  onDeleteAll,
  onDelete,
  onClearError,
  onClose,
}) {
  const [filter, setFilter] = useState(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY_NOTI_FILTER);
    return saved === "unread" ? "unread" : "all";
  });
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    window.sessionStorage.setItem(STORAGE_KEY_NOTI_FILTER, nextFilter);
  };

  const filteredList =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const filteredUnreadCount = filteredList.filter((n) => !n.isRead).length;
  const activeFilterLabel = FILTER_LABELS[filter] || "전체";
  const apiFilter = filter === "unread" ? "recruitment_unread" : "recruitment";

  const handleNavigate = (targetPath, applicationId = "") => {
    const hash = applicationId
      ? `#application-${encodeURIComponent(applicationId)}`
      : "";
    onClose();
    if (window.location.pathname === targetPath) {
      if (hash) {
        window.history.replaceState(null, "", `${targetPath}${hash}`);
      }
      emitApplicationPageRefresh({ applicationId });
    } else {
      window.location.assign(`${targetPath}${hash}`);
    }
  };

  const handleConfirmDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const ok = await onDeleteAll(apiFilter);
      if (ok) {
        setConfirmDeleteAllOpen(false);
      }
    } finally {
      setDeletingAll(false);
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
            로그인 후 새로운 알림을 확인할 수 있습니다.
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
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="sm"
            disabled={filteredUnreadCount === 0 || deletingAll}
            onClick={() => onReadAll(apiFilter)}
          >
            모두 읽음
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={filteredList.length === 0 || deletingAll}
            onClick={() => setConfirmDeleteAllOpen(true)}
          >
            모두 삭제
          </Button>
        </div>
      </div>

      <div className={styles.filterTabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            filter === "all" ? styles.tabActive : ""
          }`}
          onClick={() => handleFilterChange("all")}
        >
          전체 ({notifications.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            filter === "unread" ? styles.tabActive : ""
          }`}
          onClick={() => handleFilterChange("unread")}
        >
          안 읽음 ({unreadCount})
        </button>
      </div>

      {error && (
        <div role="alert" style={{ padding: "8px 12px 0" }}>
          <Callout variant="danger" size="compact" onClose={onClearError}>
            {error}
          </Callout>
        </div>
      )}

      {filteredList.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {filter === "unread"
              ? "읽지 않은 알림이 없습니다."
              : "도착한 알림이 없습니다."}
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

      <ConfirmModal
        open={confirmDeleteAllOpen}
        title="알림 모두 삭제"
        description={`‘${activeFilterLabel}’ 탭의 알림 ${filteredList.length}건을 모두 삭제하시겠습니까? 삭제한 알림은 복구할 수 없습니다.`}
        confirmLabel="모두 삭제"
        cancelLabel="취소"
        confirmVariant="dangerSolid"
        busy={deletingAll}
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setConfirmDeleteAllOpen(false)}
      />
    </div>
  );
}

export default NotificationDropdown;
