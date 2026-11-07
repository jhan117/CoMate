import { STATUS_FILTER_TABS } from "../../constants/applicationConstants";
import styles from "./ApplicantFilterBar.module.css";

function ApplicantFilterBar({
  counts,
  statusFilter,
  onStatusFilterChange,
  deptFilter,
  onDeptFilterChange,
  departments,
}) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.statusTabs}>
        {STATUS_FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tabBtn} ${
              statusFilter === tab.key ? styles.tabActive : ""
            }`}
            onClick={() => onStatusFilterChange(tab.key)}
          >
            {tab.label} ({counts[tab.key] ?? 0})
          </button>
        ))}
      </div>

      <div className={styles.deptSelectWrap}>
        <label htmlFor="deptFilter" className={styles.deptFilterLabel}>
          모집 부문 필터:
        </label>
        <select
          id="deptFilter"
          className={styles.deptSelect}
          value={deptFilter}
          onChange={(e) => onDeptFilterChange(e.target.value)}
        >
          <option value="all">전체 부문</option>
          {departments.map((d) => (
            <option key={d.deptName} value={d.deptName}>
              {d.deptName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ApplicantFilterBar;
