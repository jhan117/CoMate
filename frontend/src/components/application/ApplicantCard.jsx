import Callout from "../common/Callout";
import StatusBadge from "./StatusBadge";
import ApplicantDecisionFooter from "./ApplicantDecisionFooter";
import { APPLICATION_STATUS } from "../../constants/applicationConstants";
import { formatDate } from "../../utils/applicationUtils";
import styles from "./ApplicantCard.module.css";

function ApplicantCard({
  application,
  isTargetDeptFull,
  processing,
  onDecision,
}) {
  const canProcess =
    application.status === APPLICATION_STATUS.PENDING ||
    application.status === APPLICATION_STATUS.REVISION_REQUESTED;

  const isRejected = application.status === APPLICATION_STATUS.REJECTED;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            {application.applicantName.slice(0, 1)}
          </div>
          <div>
            <div className={styles.nameRow}>
              <h3 className={styles.name}>{application.applicantName}</h3>
              {application.applicantStudentId && (
                <span className={styles.studentId}>
                  ({application.applicantStudentId})
                </span>
              )}
              <span className={styles.originDept}>
                소속: {application.applicantDept}
              </span>
            </div>
            <span className={styles.appliedAt}>
              지원 일시: {formatDate(application.createdAt)}
            </span>
          </div>
        </div>

        <div className={styles.rightBadges}>
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
