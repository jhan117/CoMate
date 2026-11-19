import { useEffect } from "react";
import Button from "./Button";
import styles from "./ConfirmModal.module.css";

function ConfirmModal({
  open,
  title = "확인",
  description = "",
  preview = "",
  confirmLabel = "확인",
  cancelLabel = "취소",
  confirmVariant = "dangerSolid",
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !busy) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !busy) {
      onCancel();
    }
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={handleBackdropClick}
    >
      <div className={styles.modal}>
        <h3 id="confirm-modal-title" className={styles.title}>
          {title}
        </h3>
        {description && <p className={styles.description}>{description}</p>}
        {preview && <p className={styles.preview}>{preview}</p>}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "처리 중..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
