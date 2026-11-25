import { useState } from "react";
import Button from "../common/Button";
import Callout from "../common/Callout";
import StatusBadge from "./StatusBadge";
import {
  APPLICATION_STATUS,
  STATUS_NOTICE_MESSAGES,
} from "../../constants/applicationConstants";
import { formatDate } from "../../utils/applicationUtils";
import styles from "./SubmittedApplicationCard.module.css";

function SubmittedApplicationCard({
  application,
  isDeadlineClosed = false,
  canceling,
  onCancel,
  onStartRevision,
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const isRejected = application.status === APPLICATION_STATUS.REJECTED;
  const isPending = application.status === APPLICATION_STATUS.PENDING;
  const isRevisionRequested =
    application.status === APPLICATION_STATUS.REVISION_REQUESTED;
  const canCancel = isPending || isRevisionRequested;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <span className={styles.subLabel}>내 지원 현황</span>
          <h3 className={styles.title}>제출된 지원서 내역</h3>
          {application.createdAt && (
            <span className={styles.timeMeta}>
              제출 일시: {formatDate(application.createdAt)}
              {application.updatedAt
                ? ` · 보완 재제출: ${formatDate(application.updatedAt)}`
                : ""}
            </span>
          )}
        </div>
        <StatusBadge status={application.status} />
      </div>

      <Callout
        variant={
          isRejected
            ? "danger"
            : isRevisionRequested
              ? "revision"
              : "neutralBordered"
        }
      >
        {STATUS_NOTICE_MESSAGES[application.status]}
      </Callout>

      {isRevisionRequested && application.feedback && (
        <Callout variant="revision" title="작성자의 보완 요청 내용">
          {application.feedback}
        </Callout>
      )}

      {isRejected && application.feedback && (
        <Callout variant="rejected" title="거절 사유">
          {application.feedback}
        </Callout>
      )}

      {isRevisionRequested && isDeadlineClosed && (
        <Callout variant="danger" size="compact">
          모집 마감일이 지나 지원서를 다시 제출할 수 없습니다.
        </Callout>
      )}

      <div className={styles.applicantMetaBar}>
        <span className={styles.applicantMetaLabel}>지원자 정보</span>
        <div className={styles.applicantMetaValues}>
          <strong>{application.applicantName}</strong>
          <span className={styles.applicantDeptChip}>
            {application.applicantDept}
          </span>
          {application.applicantEmail && (
            <span className={styles.applicantEmailText}>
              {application.applicantEmail}
            </span>
          )}
        </div>
      </div>

      <dl className={styles.detailGrid}>
        <div className={styles.detailItemFull}>
          <dt>지원 부문</dt>
          <dd>
            <strong>{application.targetDept}</strong>
          </dd>
        </div>
        <div className={styles.detailItemFull}>
          <dt>지원 동기</dt>
          <dd className={styles.messageBox}>{application.message}</dd>
        </div>
      </dl>

      {confirmingCancel ? (
        <div className={styles.confirmBox}>
          <span className={styles.confirmText}>
            제출한 지원서를 정말 취소하시겠습니까?
          </span>
          <div className={styles.confirmBtns}>
            <Button
              variant="secondary"
              size="sm"
              disabled={canceling}
              onClick={() => setConfirmingCancel(false)}
            >
              유지
            </Button>
            <Button
              variant="dangerSolid"
              size="sm"
              disabled={canceling}
              onClick={() => onCancel(application.id)}
            >
              {canceling ? "취소 처리 중..." : "지원 취소 확정"}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <Button as="a" href="/" variant="secondary" size="md">
            ← 목록으로 돌아가기
          </Button>
          <div className={styles.rightActions}>
            {canCancel && (
              <Button
                variant="danger"
                size="md"
                disabled={canceling}
                onClick={() => setConfirmingCancel(true)}
              >
                지원 취소
              </Button>
            )}
            {isRevisionRequested && !isDeadlineClosed && onStartRevision && (
              <Button
                variant="primary"
                size="md"
                disabled={canceling}
                onClick={onStartRevision}
              >
                지원서 보완 작성하기
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmittedApplicationCard;
