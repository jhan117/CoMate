import { useState } from "react";
import Button from "../components/common/Button";
import Callout from "../components/common/Callout";
import ConfirmModal from "../components/common/ConfirmModal";
import ConversationList from "../components/messages/ConversationList";
import ChatThread from "../components/messages/ChatThread";
import { useMessages } from "../hooks/useMessages";
import styles from "./MessagesPage.module.css";

function MessagesPage() {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    currentUser,
    authChecked,
    conversations,
    selectedConversationId,
    activeConversation,
    messages,
    loading,
    threadLoading,
    sending,
    processingMessageId,
    error,
    errorStatus,
    feedbackBanner,
    actions,
  } = useMessages();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await actions.removeMessage(deleteTarget.id);
    if (ok) {
      setDeleteTarget(null);
    }
  };

  if (!authChecked || loading) {
    return (
      <main className={styles.pageWrapper}>
        <p className={styles.loadingText}>쪽지함을 불러오는 중입니다...</p>
      </main>
    );
  }

  if (errorStatus === 401 || !currentUser) {
    return (
      <main className={styles.pageWrapper}>
        <div className={styles.pageContainer}>
          <div className={styles.loginRequiredCard}>
            <Callout
              variant="neutralBordered"
              title="로그인이 필요한 서비스입니다"
            >
              {error ||
                "쪽지를 주고받거나 대화 내역을 확인하려면 먼저 로그인해 주세요."}
            </Callout>
            <div style={{ marginTop: "16px" }}>
              <Button as="a" href="/" variant="primary" size="md">
                메인 화면으로 이동하여 로그인하기
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.pageWrapper}>
      <div className={styles.pageContainer}>
        {feedbackBanner && (
          <div role="status">
            <Callout
              variant={feedbackBanner.type === "error" ? "danger" : "success"}
            >
              {feedbackBanner.message}
            </Callout>
          </div>
        )}

        {error && errorStatus !== 401 && (
          <div role="alert">
            <Callout variant="danger">{error}</Callout>
          </div>
        )}

        <div
          className={`${styles.splitLayout} ${
            selectedConversationId ? styles.hasSelection : ""
          }`}
        >
          <div className={styles.listPane}>
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={actions.selectConversation}
            />
          </div>

          <div className={styles.threadPane}>
            <ChatThread
              conversation={activeConversation}
              messages={messages}
              currentUser={currentUser}
              loading={threadLoading}
              sending={sending}
              processingMessageId={processingMessageId}
              onSend={actions.sendMessage}
              onEdit={actions.editMessage}
              onRequestDelete={setDeleteTarget}
              onBackToList={actions.clearSelectedConversation}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="쪽지 삭제"
        description="이 쪽지를 삭제하시겠습니까? 삭제한 쪽지는 복구할 수 없습니다."
        preview={deleteTarget?.content || ""}
        confirmLabel="삭제"
        cancelLabel="취소"
        confirmVariant="dangerSolid"
        busy={Boolean(
          deleteTarget && processingMessageId === String(deleteTarget.id)
        )}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}

export default MessagesPage;
