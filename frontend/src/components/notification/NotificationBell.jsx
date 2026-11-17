import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";
import MyActivityDropdown from "./MyActivityDropdown";
import styles from "./NotificationBell.module.css";

function NotificationBell({ currentUser = null }) {
  const [open, setOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const wrapperRef = useRef(null);

  const { activeUser, notifications, unreadCount, error, actions } =
    useNotifications(currentUser);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setActivityOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    const nextOpen = !open;
    setActivityOpen(false);
    setOpen(nextOpen);
    if (nextOpen) {
      actions.refresh();
    }
  };

  const handleToggleActivity = () => {
    setOpen(false);
    setActivityOpen((prev) => !prev);
  };

  return (
    <div className={styles.bellWrapper} ref={wrapperRef}>
      {activeUser && (
        <button
          type="button"
          className={`${styles.currentUserBadge} ${
            activityOpen ? styles.bellBtnActive : ""
          }`}
          aria-label="내 모집 및 지원 현황 열기"
          aria-expanded={activityOpen}
          onClick={handleToggleActivity}
        >
          <strong>{activeUser.name}</strong> 님 ({activeUser.dept}) ·{" "}
          <span className={styles.hubTriggerLabel}>내 모집·지원 ▾</span>
        </button>
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

      {activityOpen && activeUser && (
        <MyActivityDropdown
          activeUser={activeUser}
          onClose={() => setActivityOpen(false)}
        />
      )}

      {open && (
        <NotificationDropdown
          activeUser={activeUser}
          notifications={notifications}
          unreadCount={unreadCount}
          error={error}
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
