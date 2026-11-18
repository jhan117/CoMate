import { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import MessageBubble from "./MessageBubble";
import { MESSAGE_MAX_LENGTH } from "../../constants/messageConstants";
import styles from "./ChatThread.module.css";

function ChatThread({
  conversation,
  messages,
  currentUser,
  loading = false,
  sending = false,
  processingMessageId = "",
  onSend,
  onEdit,
  onRequestDelete,
  onBackToList,
}) {
  const [content, setContent] = useState("");
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages.length, conversation?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    const ok = await onSend(trimmed);
    if (ok) {
      setContent("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!conversation) {
    return (
      <section className={styles.emptyPanel} aria-label="쪽지 대화창">
        <div className={styles.emptyInner}>
          <h3 className={styles.emptyTitle}>대화방을 선택해 주세요</h3>
          <p className={styles.emptyDesc}>
            왼쪽 목록에서 대화방을 선택해 쪽지를 확인하고 답장을 보낼 수
            있습니다.
          </p>
        </div>
      </section>
    );
  }

  const partner = conversation.partner || {};

  return (
    <section className={styles.threadPanel} aria-label="쪽지 대화창">
      <header className={styles.threadHeader}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.backBtn}
            aria-label="대화방 목록으로 돌아가기"
            onClick={onBackToList}
          >
            ←
          </button>

          <div className={styles.partnerProfile}>
            <div className={styles.partnerAvatar}>
              {(partner.name || "?").slice(0, 1)}
            </div>
            <div className={styles.partnerTextGroup}>
              <div className={styles.partnerTitleRow}>
                <h3 className={styles.partnerName}>{partner.name}</h3>
                {partner.studentId && (
                  <span className={styles.partnerStudentId}>
                    ({partner.studentId})
                  </span>
                )}
                {partner.dept && (
                  <span className={styles.partnerDeptBadge}>
                    {partner.dept}
                  </span>
                )}
              </div>
              {conversation.post?.id && (
                <div className={styles.postLinkRow}>
                  <span className={styles.postContextLabel}>
                    모집글:{" "}
                    <strong>
                      [{conversation.post.category || "모집"}]{" "}
                      {conversation.post.title}
                    </strong>
                  </span>
                  <a
                    href={`/posts/${encodeURIComponent(
                      conversation.post.id
                    )}/application`}
                    className={styles.postLink}
                  >
                    지원 페이지 →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.messageList} ref={scrollAreaRef}>
        {loading ? (
          <p className={styles.centerStatus}>대화 내역을 불러오는 중입니다...</p>
        ) : messages.length === 0 ? (
          <div className={styles.noMessagesBox}>
            <p className={styles.noMessagesTitle}>
              {partner.name} 님과의 첫 쪽지를 보내보세요!
            </p>
            <p className={styles.noMessagesSub}>
              보낸 쪽지는 실시간으로 전달되며 대화 내역에 저장됩니다.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={String(msg.senderId) === String(currentUser?.id)}
              processing={processingMessageId === String(msg.id)}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
            />
          ))
        )}
      </div>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <label className={styles.srOnly} htmlFor="direct-message-input">
          쪽지 내용 입력
        </label>
        <textarea
          id="direct-message-input"
          className={styles.composerInput}
          placeholder={`${partner.name} 님에게 보낼 쪽지를 입력해 주세요 (Enter 전송, Shift+Enter 줄바꿈)`}
          value={content}
          maxLength={MESSAGE_MAX_LENGTH}
          rows={2}
          disabled={sending}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.composerFooter}>
          <span className={styles.charCounter}>
            {content.length} / {MESSAGE_MAX_LENGTH}자
          </span>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={sending || !content.trim()}
          >
            {sending ? "전송 중..." : "쪽지 보내기"}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default ChatThread;
