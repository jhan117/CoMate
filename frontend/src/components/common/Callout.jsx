import styles from "./Callout.module.css";

function Callout({
  variant = "neutral",
  size = "md",
  title,
  onClose,
  children,
  className = "",
}) {
  const combinedClassName = [
    styles.callout,
    styles[variant] || styles.neutral,
    size === "compact" ? styles.compact : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={combinedClassName}>
      <div className={styles.innerRow}>
        <div className={styles.content}>
          {title && <span className={styles.title}>{title}</span>}
          <div className={styles.body}>{children}</div>
        </div>
        {onClose && (
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="안내 닫기"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default Callout;
