import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";
import styles from "./NotificationBell.module.css";

function NotificationBell({ currentUser = null }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const { activeUser, notifications, unreadCount, actions } =
    useNotifications(currentUser);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      actions.refresh();
    }
  };

  return (
    <div className={styles.bellWrapper} ref={wrapperRef}>
      {activeUser && (
        <span className={styles.currentUserBadge}>
          <strong>{activeUser.name}</strong> 님 ({activeUser.dept})
        </span>
      )}

      <button
        type="button"
        className={`${styles.bellBtn} ${open ? styles.bellBtnActive : ""}`}
        aria-label="알림 열기"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <svg
          className={styles.bellIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className={styles.bellLabel}>알림</span>
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount}</span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          activeUser={activeUser}
          notifications={notifications}
          unreadCount={unreadCount}
          onRead={actions.markAsRead}
          onReadAll={actions.markAllAsRead}
          onDelete={actions.remove}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export default NotificationBell;
