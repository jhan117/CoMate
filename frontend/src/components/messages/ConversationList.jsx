import { formatDate, formatRelativeTime } from "../../utils/applicationUtils";
import styles from "./ConversationList.module.css";

function ConversationList({ conversations, selectedId, onSelect }) {
  return (
    <aside className={styles.sidebar} aria-label="쪽지 대화방 목록">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>쪽지</h2>
          <p className={styles.subtitle}>
            총 <strong>{conversations.length}</strong>개의 대화방
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyTitle}>진행 중인 대화가 없습니다.</p>
          <p className={styles.emptyDesc}>
            모집글 지원 페이지에서 모집 팀장 또는 지원자에게 쪽지를 보내면
            이곳에 대화방이 표시됩니다.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {conversations.map((conv) => {
            const isSelected = String(conv.id) === String(selectedId);
            const partner = conv.partner || {};
            const lastMsg = conv.lastMessage;
            const unreadCount = Number(conv.unreadCount || 0);

            return (
              <li key={conv.id}>
                <button
                  type="button"
                  className={`${styles.itemBtn} ${
                    isSelected ? styles.itemBtnActive : ""
                  }`}
                  onClick={() => onSelect(conv.id)}
                >
                  <div className={styles.avatar}>
                    {(partner.name || "?").slice(0, 1)}
                  </div>

                  <div className={styles.itemBody}>
                    <div className={styles.topRow}>
                      <div className={styles.partnerInfo}>
                        <strong className={styles.partnerName}>
                          {partner.name}
                        </strong>
                        {partner.dept && (
                          <span className={styles.partnerDept}>
                            {partner.dept}
                          </span>
                        )}
                      </div>
                      <span
                        className={styles.timeText}
                        title={formatDate(
                          lastMsg?.createdAt || conv.updatedAt
                        )}
                      >
                        {formatRelativeTime(
                          lastMsg?.createdAt || conv.updatedAt
                        )}
                      </span>
                    </div>

                    {conv.post?.title && (
                      <div className={styles.postContextTag}>
                        [{conv.post.category || "모집글"}] {conv.post.title}
                      </div>
                    )}

                    <div className={styles.bottomRow}>
                      <p className={styles.previewText}>
                        {lastMsg
                          ? lastMsg.content
                          : "아직 주고받은 쪽지가 없습니다."}
                      </p>
                      {unreadCount > 0 && (
                        <span
                          className={styles.unreadBadge}
                          aria-label={`읽지 않은 쪽지 ${unreadCount}건`}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

export default ConversationList;
