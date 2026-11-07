import styles from "./DevRoleToggle.module.css";

function DevRoleToggle({ isAuthorMode, onToggleRole }) {
  return (
    <div className={styles.toggleBar}>
      <span className={styles.label}>시점 전환</span>
      <div className={styles.btnGroup}>
        <button
          type="button"
          className={`${styles.roleBtn} ${!isAuthorMode ? styles.roleBtnActive : ""
            }`}
          onClick={() => onToggleRole(false)}
        >
          지원자 시점
        </button>
        <button
          type="button"
          className={`${styles.roleBtn} ${isAuthorMode ? styles.roleBtnActive : ""
            }`}
          onClick={() => onToggleRole(true)}
        >
          작성자 시점
        </button>
      </div>
    </div>
  );
}

export default DevRoleToggle;
