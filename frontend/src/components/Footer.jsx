import styles from "./Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footer}>
      <p>고급웹프로그래밍 Final Project</p>
      <p>
        © 2026{" "}
        <a
          href="https://github.com/jhan117/CoMate"
          target="_blank"
          rel="noreferrer"
        >
          Kaye &amp; Ella
        </a>
        . All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
