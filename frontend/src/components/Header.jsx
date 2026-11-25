import MessageIcon from "./common/MessageIcon";
import NotificationBell from "./notification/NotificationBell";
import { useNotifications } from "../hooks/useNotifications";
import styles from "./Header.module.css";
import AuthBar from "./auth/AuthBar";

function Header({ user, onUserChange, authLoading }) {
  const isMessagesPage = /^\/messages\/?$/.test(window.location.pathname);
  const {
    activeUser,
    recruitmentNotifications,
    recruitmentUnreadCount,
    unreadMessageCount,
    error,
    actions,
  } = useNotifications(authLoading ? null : user);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brandGroup}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoText}>
              Co<span className={styles.logoAccent}>Mate</span>
            </span>
          </a>
          <span className={styles.subtitle}>교내 팀원 모집 플랫폼</span>
        </div>

        <div className={styles.rightActions}>
          {!authLoading && user && (
            <>
              <a
                href="/messages"
                className={`${styles.messageNavLink} ${
                  isMessagesPage ? styles.messageNavLinkActive : ""
                }`}
                aria-label={
                  unreadMessageCount > 0
                    ? `쪽지함 이동 (읽지 않은 대화 ${unreadMessageCount}건)`
                    : "쪽지함 이동"
                }
                aria-current={isMessagesPage ? "page" : undefined}
              >
                <MessageIcon className={styles.messageNavIcon} />
                <span className={styles.messageNavLabel}>쪽지</span>
                {unreadMessageCount > 0 && (
                  <span className={styles.unreadBadge}>
                    {unreadMessageCount}
                  </span>
                )}
              </a>
              <NotificationBell
                activeUser={activeUser}
                notifications={recruitmentNotifications}
                unreadCount={recruitmentUnreadCount}
                error={error}
                actions={actions}
              />
            </>
          )}
          <AuthBar
            user={user}
            onUserChange={onUserChange}
            authLoading={authLoading}
          />
        </div>
      </div>
    </header>
  );
}

export default Header;
