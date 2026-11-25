import Callout from "../common/Callout";
import MessageIconLink from "../common/MessageIconLink";
import StatusBadge from "./StatusBadge";
import ApplicantDecisionFooter from "./ApplicantDecisionFooter";
import { APPLICATION_STATUS } from "../../constants/applicationConstants";
import { formatDate } from "../../utils/applicationUtils";
import styles from "./ApplicantCard.module.css";

function ApplicantCard({
  application,
  isTargetDeptFull,
  processing,
  highlighted = false,
  onDecision,
}) {
  const canProcess =
    application.status === APPLICATION_STATUS.PENDING ||
    application.status === APPLICATION_STATUS.REVISION_REQUESTED;

  const isRejected = application.status === APPLICATION_STATUS.REJECTED;

  return (
    <article
      id={`application-${application.id}`}
      className={`${styles.card} ${highlighted ? styles.cardHighlighted : ""
        }`}
    >
      <div className={styles.header}>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            {application.applicantName.slice(0, 1)}
          </div>
          <div className={styles.profileText}>
            <div className={styles.nameRow}>
              <h3 className={styles.name}>{application.applicantName}</h3>
              <span className={styles.originDept}>
                소속: {application.applicantDept}
              </span>
              {application.isResubmitted && (
                <span className={styles.resubmittedBadge}>보완 재제출됨</span>
              )}
            </div>
            {application.applicantEmail && (
              <p className={styles.email}>{application.applicantEmail}</p>
            )}
            <span className={styles.appliedAt}>
              지원 일시: {formatDate(application.createdAt)}
              {application.updatedAt
                ? ` · 보완 재제출: ${formatDate(application.updatedAt)}`
                : ""}
              {application.processedAt
                ? ` · 처리 일시: ${formatDate(application.processedAt)}`
                : ""}
            </span>
          </div>
        </div>

        <div className={styles.rightBadges}>
          <MessageIconLink
            recipientId={application.applicantId}
            postId={application.postId}
            label="지원자에게 쪽지 보내기"
          />
          <span className={styles.targetDeptBadge}>
            지원 부문: <strong>{application.targetDept}</strong>
          </span>
          <StatusBadge status={application.status} />
        </div>
      </div>

      <div className={styles.body}>
        <Callout variant="neutral" title="지원 동기">
          {application.message}
        </Callout>

        {application.previousFeedback && !application.feedback && (
          <Callout variant="neutralBordered" title="이전 보완 요청 내용 (재제출 반영 완료)">
            {application.previousFeedback}
          </Callout>
        )}

        {application.feedback && (
          <Callout
            variant={isRejected ? "rejected" : "revision"}
            title={isRejected ? "거절 사유" : "전달한 보완 요청 내용"}
          >
            {application.feedback}
          </Callout>
        )}
      </div>

      {canProcess && (
        <ApplicantDecisionFooter
          application={application}
          isTargetDeptFull={isTargetDeptFull}
          processing={processing}
          onDecision={onDecision}
        />
      )}
    </article>
  );
}

export default ApplicantCard;
