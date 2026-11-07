import {
  APPLICATION_STATUS,
  STATUS_LABELS,
} from "../../constants/applicationConstants";
import styles from "./StatusBadge.module.css";

const STATUS_STYLE_MAP = {
  [APPLICATION_STATUS.APPROVED]: styles.approved,
  [APPLICATION_STATUS.REJECTED]: styles.rejected,
  [APPLICATION_STATUS.REVISION_REQUESTED]: styles.revision,
  [APPLICATION_STATUS.PENDING]: styles.pending,
};

function StatusBadge({ status }) {
  const variantClass = STATUS_STYLE_MAP[status] || styles.pending;
  const label =
    STATUS_LABELS[status] || STATUS_LABELS[APPLICATION_STATUS.PENDING];

  return <span className={`${styles.badge} ${variantClass}`}>{label}</span>;
}

export default StatusBadge;
