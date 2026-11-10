import NotificationBell from "./notification/NotificationBell";
import styles from "./Header.module.css";

function Header() {
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
        </div>
      </div>
    </header>
  );
}

export default Header;
