import Button from "../common/Button";
import Callout from "../common/Callout";
import StatusBadge from "./StatusBadge";
import {
  APPLICATION_STATUS,
  STATUS_NOTICE_MESSAGES,
} from "../../constants/applicationConstants";
import styles from "./SubmittedApplicationCard.module.css";

function SubmittedApplicationCard({ application, canceling, onCancel }) {
  const isRejected = application.status === APPLICATION_STATUS.REJECTED;
  const isPending = application.status === APPLICATION_STATUS.PENDING;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <span className={styles.subLabel}>내 지원 현황</span>
          <h3 className={styles.title}>제출된 지원서 내역</h3>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <Callout variant={isRejected ? "danger" : "neutralBordered"}>
        {STATUS_NOTICE_MESSAGES[application.status]}
      </Callout>

      {isRejected && application.feedback && (
        <Callout variant="rejected" title="거절 사유">
          {application.feedback}
        </Callout>
      )}

      <dl className={styles.detailGrid}>
        <div className={styles.detailItem}>
          <dt>지원자 이름 / 학번</dt>
          <dd>
            {application.applicantName} ({application.applicantStudentId})
          </dd>
        </div>
        <div className={styles.detailItem}>
          <dt>소속 학과</dt>
          <dd>{application.applicantDept}</dd>
        </div>
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

      <div className={styles.actions}>
        <Button as="a" href="/" variant="secondary" size="md">
          ← 목록으로 돌아가기
        </Button>
        {isPending && (
          <Button
            variant="danger"
            size="md"
            disabled={canceling}
            onClick={() => onCancel(application.id)}
          >
            {canceling ? "취소 처리 중..." : "지원 취소"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default SubmittedApplicationCard;
