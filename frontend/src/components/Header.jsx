import MessageIcon from "./common/MessageIcon";
import NotificationBell from "./notification/NotificationBell";
import styles from "./Header.module.css";
import AuthBar from "./auth/AuthBar";

function Header({ user, onUserChange, authLoading }) {
  const isMessagesPage = /^\/messages\/?$/.test(window.location.pathname);
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
          <a
            href="/messages"
            className={`${styles.messageNavLink} ${
              isMessagesPage ? styles.messageNavLinkActive : ""
            }`}
            aria-label="쪽지함 이동"
            aria-current={isMessagesPage ? "page" : undefined}
          >
            <MessageIcon className={styles.messageNavIcon} />
            <span className={styles.messageNavLabel}>쪽지</span>
          </a>
          <NotificationBell currentUser={user} />
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
