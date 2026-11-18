import { useState } from "react";
import { MESSAGE_MAX_LENGTH } from "../../constants/messageConstants";
import { formatDate } from "../../utils/applicationUtils";
import styles from "./MessageBubble.module.css";

function MessageBubble({
  message,
  isMine,
  processing = false,
  onEdit,
  onRequestDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  const trimmedDraft = draft.trim();
  const canSave = Boolean(trimmedDraft) && trimmedDraft !== message.content.trim();

  const handleStartEdit = () => {
    setDraft(message.content);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setDraft(message.content);
    setEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!canSave || processing) return;
    const ok = await onEdit(message.id, trimmedDraft);
    if (ok) {
      setEditing(false);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  return (
    <div
      className={`${styles.row} ${isMine ? styles.rowMine : styles.rowPartner}`}
    >
      <div
        className={`${styles.bubbleWrap} ${
          isMine ? styles.bubbleWrapMine : styles.bubbleWrapPartner
        }`}
      >
        {!isMine && (
          <div className={styles.senderMeta}>
            <strong>{message.senderName}</strong>
            {message.senderDept && (
              <span className={styles.senderDept}>{message.senderDept}</span>
            )}
          </div>
        )}

        <div
          className={`${styles.bubbleRow} ${
            isMine ? styles.bubbleRowMine : styles.bubbleRowPartner
          }`}
        >
          {isMine && !message.isRead && !message.isDeleted && (
            <span
              className={styles.unreadMark}
              title="상대방이 아직 읽지 않음"
            >
              1
            </span>
          )}

          {message.isDeleted ? (
            <div
              className={`${styles.bubble} ${styles.bubbleDeleted} ${
                isMine ? styles.bubbleDeletedMine : styles.bubbleDeletedPartner
              }`}
            >
              <p className={styles.deletedContent}>{message.content}</p>
            </div>
          ) : editing ? (
            <div className={`${styles.bubble} ${styles.bubbleEditing}`}>
              <div className={styles.editGrid}>
                <span className={styles.editMirror} aria-hidden="true">
                  {draft || " "}
                  {draft.endsWith("\n") ? " " : ""}
                </span>
                <textarea
                  className={styles.editInput}
                  value={draft}
                  maxLength={MESSAGE_MAX_LENGTH}
                  rows={1}
                  disabled={processing}
                  aria-label="쪽지 내용 수정"
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                />
              </div>
            </div>
          ) : (
            <div
              className={`${styles.bubble} ${
                isMine ? styles.bubbleMine : styles.bubblePartner
              }`}
            >
              <p className={styles.content}>{message.content}</p>
            </div>
          )}
        </div>

        <div
          className={`${styles.bottomMeta} ${
            isMine ? styles.bottomMetaMine : styles.bottomMetaPartner
          }`}
        >
          <span className={styles.timestamp}>
            {formatDate(message.createdAt)}
            {message.isEdited && !message.isDeleted ? " · (수정됨)" : ""}
          </span>

          {isMine && !message.isDeleted && (
            <div className={styles.actionLinks}>
              {editing ? (
                <>
                  <button
                    type="button"
                    className={styles.metaActionBtn}
                    disabled={processing}
                    onClick={handleCancelEdit}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={`${styles.metaActionBtn} ${styles.metaSaveBtn}`}
                    disabled={processing || !canSave}
                    onClick={handleSaveEdit}
                  >
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.metaActionBtn}
                    disabled={processing}
                    onClick={handleStartEdit}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className={`${styles.metaActionBtn} ${styles.metaDeleteBtn}`}
                    disabled={processing}
                    onClick={() => onRequestDelete(message)}
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
