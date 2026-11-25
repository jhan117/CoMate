import Button from "./Button";
import Callout from "./Callout";
import Modal from "./Modal";
import styles from "./ConfirmModal.module.css";

function ConfirmModal({
  open,
  title = "확인",
  description = "",
  preview = "",
  error = "",
  confirmLabel = "확인",
  cancelLabel = "취소",
  confirmVariant = "dangerSolid",
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      maxWidth={400}
      busy={busy}
      showCloseButton={false}
      compact
      onClose={onCancel}
    >
      {description && <p className={styles.description}>{description}</p>}
      {preview && <p className={styles.preview}>{preview}</p>}
      {error && (
        <div role="alert" className={styles.errorBox}>
          <Callout variant="danger" size="compact">
            {error}
          </Callout>
        </div>
      )}
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
    </Modal>
  );
}

export default ConfirmModal;
