import Button from "./Button";
import styles from "./SubPageTopBar.module.css";

function SubPageTopBar({
  currentLabel,
  parentLabel = "모집 게시판",
  backHref = "/",
  backLabel = "← 목록으로 돌아가기",
}) {
  return (
    <div className={styles.topBar}>
      <div className={styles.topBarLeft}>
        <Button as="a" href={backHref} variant="secondary" size="sm">
          {backLabel}
        </Button>
        <span className={styles.breadcrumb}>
          {parentLabel} / <strong>{currentLabel}</strong>
        </span>
      </div>
    </div>
  );
}

export default SubPageTopBar;
