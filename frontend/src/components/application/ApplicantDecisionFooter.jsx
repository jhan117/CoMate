import { useState } from "react";
import Button from "../common/Button";
import Callout from "../common/Callout";
import { APPLICATION_STATUS } from "../../constants/applicationConstants";
import styles from "./ApplicantDecisionFooter.module.css";

function ApplicantDecisionFooter({
  application,
  isTargetDeptFull,
  processing,
  onDecision,
}) {
  // null | 'revision_requested' | 'rejected'
  const [feedbackMode, setFeedbackMode] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackError, setFeedbackError] = useState("");

  const isRevisionMode = feedbackMode === APPLICATION_STATUS.REVISION_REQUESTED;
  const isRejectedMode = feedbackMode === APPLICATION_STATUS.REJECTED;

  const openFeedbackBox = (mode) => {
    setFeedbackMode(mode);
    setFeedbackText(application.feedback || "");
    setFeedbackError("");
  };

  const closeFeedbackBox = () => {
    setFeedbackMode(null);
    setFeedbackText("");
    setFeedbackError("");
  };

  const handleConfirmFeedback = async () => {
    if (!feedbackText.trim()) {
      setFeedbackError(
        isRevisionMode
          ? "보완 요청 사유를 입력해 주세요."
          : "거절 사유를 입력해 주세요."
      );
      return;
    }
    await onDecision(application, feedbackMode, feedbackText.trim());
    closeFeedbackBox();
  };

  return (
    <div className={styles.footer}>
      {feedbackMode ? (
        <div className={styles.feedbackFormBox}>
          {isRejectedMode && (
            <Callout variant="danger">
              거절 처리 시 해당 지원자는 이 모집글에 다시 지원할 수 없습니다. 내용 보충이나 추가 확인이 필요한 경우 보완 요청을 이용해 주세요.
            </Callout>
          )}

          <label className={styles.feedbackFormLabel}>
            {isRevisionMode ? "보완 요청 내용" : "거절 사유"}
          </label>
          <textarea
            rows={3}
            className={styles.feedbackTextarea}
            placeholder={
              isRevisionMode
                ? "지원자에게 추가로 확인하거나 보충을 요청할 내용을 작성해 주세요"
                : "지원자에게 전달할 거절 사유를 작성해 주세요"
            }
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
          {feedbackError && (
            <p className={styles.feedbackErrorText}>{feedbackError}</p>
          )}

          <div className={styles.feedbackFormActions}>
            <Button
              variant="secondary"
              size="sm"
              disabled={processing}
              onClick={closeFeedbackBox}
            >
              취소
            </Button>
            <Button
              variant={isRejectedMode ? "dangerSolid" : "revisionSolid"}
              size="sm"
              disabled={processing}
              onClick={handleConfirmFeedback}
            >
              {isRevisionMode ? "보완 요청 전달" : "거절 확정"}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.btnGroup}>
          <Button
            variant="revision"
            size="md"
            disabled={processing}
            onClick={() =>
              openFeedbackBox(APPLICATION_STATUS.REVISION_REQUESTED)
            }
          >
            보완 요청
          </Button>
          <Button
            variant="danger"
            size="md"
            disabled={processing}
            onClick={() => openFeedbackBox(APPLICATION_STATUS.REJECTED)}
          >
            거절
          </Button>
          <Button
            variant="approve"
            size="md"
            disabled={processing || isTargetDeptFull}
            onClick={() =>
              onDecision(application, APPLICATION_STATUS.APPROVED, "")
            }
          >
            승인
          </Button>
        </div>
      )}
    </div>
  );
}

export default ApplicantDecisionFooter;
