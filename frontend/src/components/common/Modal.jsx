import { useEffect, useId } from "react";
import styles from "./Modal.module.css";

function Modal({
  open = true,
  title,
  maxWidth = 420,
  busy = false,
  showCloseButton = true,
  compact = false,
  className = "",
  onClose,
  children,
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const modalClassName = [
    styles.modal,
    compact ? styles.compact : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div
        className={modalClassName}
        style={{ maxWidth: `${maxWidth}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {title && (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                className={styles.closeButton}
                disabled={busy}
                onClick={onClose}
                aria-label="닫기"
              >
                ×
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default Modal;
