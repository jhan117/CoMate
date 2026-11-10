import {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
} from "../../constants/notificationConstants";
import { formatDate } from "../../utils/applicationUtils";
import styles from "./NotificationItem.module.css";

const TYPE_STYLE_MAP = {
  [NOTIFICATION_TYPES.APPLICATION_NEW]: styles.typeNew,
  [NOTIFICATION_TYPES.APPLICATION_RESUBMITTED]: styles.typeResubmitted,
  [NOTIFICATION_TYPES.APPLICATION_APPROVED]: styles.typeApproved,
  [NOTIFICATION_TYPES.APPLICATION_REVISION]: styles.typeRevision,
  [NOTIFICATION_TYPES.APPLICATION_REJECTED]: styles.typeRejected,
  [NOTIFICATION_TYPES.RECRUITMENT_CLOSED]: styles.typeClosed,
};

function NotificationItem({ notification, onRead, onDelete, onNavigate }) {
  const typeClass =
    TYPE_STYLE_MAP[notification.type] || styles.typeNew;
  const typeLabel =
    NOTIFICATION_TYPE_LABELS[notification.type] || "알림";

  const handleCardClick = async () => {
    if (!notification.isRead) {
      await onRead(notification.id);
    }
    if (notification.postId) {
      onNavigate(`/posts/${encodeURIComponent(notification.postId)}/application`);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <li
      className={`${styles.item} ${
        notification.isRead ? styles.itemRead : styles.itemUnread
      }`}
      onClick={handleCardClick}
    >
      <div className={styles.topRow}>
        <div className={styles.badgeGroup}>
          {!notification.isRead && <span className={styles.unreadDot} />}
          <span className={`${styles.typeBadge} ${typeClass}`}>
            {typeLabel}
          </span>
          <strong className={styles.title}>{notification.title}</strong>
        </div>
        <button
          type="button"
          className={styles.deleteBtn}
          aria-label="알림 삭제"
          onClick={handleDeleteClick}
        >
          삭제
        </button>
      </div>

      <p className={styles.message}>{notification.message}</p>

      <div className={styles.bottomRow}>
        <span className={styles.time}>{formatDate(notification.createdAt)}</span>
        {notification.postId && (
          <span className={styles.linkHint}>지원 페이지 확인 →</span>
        )}
      </div>
    </li>
  );
}

export default NotificationItem;
