import NotificationBell from "./notification/NotificationBell";
import styles from "./Header.module.css";

function Header() {
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
            <svg
              className={styles.messageNavIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className={styles.messageNavLabel}>쪽지</span>
          </a>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

export default Header;
