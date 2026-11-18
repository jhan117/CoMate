import NotificationBell from "./notification/NotificationBell";
import styles from "./Header.module.css";
import AuthBar from "./auth/AuthBar";

function Header({ user, onUserChange, authLoading }) {
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
          <NotificationBell />
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
