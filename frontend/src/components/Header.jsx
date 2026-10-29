import styles from "./Header.module.css";

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoText}>
            Co<span className={styles.logoAccent}>Mate</span>
          </span>
        </a>
        <span className={styles.subtitle}>교내 팀원 모집 플랫폼</span>
      </div>
    </header>
  );
}

export default Header;
