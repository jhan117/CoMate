import styles from "./Callout.module.css";

function Callout({ variant = "neutral", title, children, className = "" }) {
  const combinedClassName = [
    styles.callout,
    styles[variant] || styles.neutral,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={combinedClassName}>
      {title && <span className={styles.title}>{title}</span>}
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export default Callout;
