import { useState } from "react";
import Button from "../common/Button";
import Callout from "../common/Callout";
import { APPLICATION_STATUS } from "../../constants/applicationConstants";
import {
  getFirstAvailableDeptName,
  isDeptFull,
} from "../../utils/applicationUtils";
import styles from "./ApplicationForm.module.css";

function ApplicationForm({
  post,
  currentUser,
  existingApplication,
  submitting,
  canceling,
  onSubmit,
  onCancel,
}) {
  const isRevisionMode =
    existingApplication &&
    existingApplication.status === APPLICATION_STATUS.REVISION_REQUESTED;

  const firstAvailable = getFirstAvailableDeptName(post.departments);

  const [targetDept, setTargetDept] = useState(
    isRevisionMode ? existingApplication.targetDept : firstAvailable
  );
  const [message, setMessage] = useState(
    isRevisionMode ? existingApplication.message : ""
  );
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!targetDept) {
      setErrorMsg("지원할 모집 부문을 선택해 주세요.");
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      setErrorMsg("지원 동기를 5자 이상 작성해 주세요.");
      return;
    }

    try {
      await onSubmit({
        targetDept,
        message,
      });
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formCard}>
      <div className={styles.formHeader}>
        <h3 className={styles.formTitle}>
          {isRevisionMode ? "지원서 보완 작성" : "팀원 지원서 작성"}
        </h3>
        <p className={styles.formDesc}>
          {isRevisionMode
            ? "작성자의 보완 요청 내용을 확인하고 지원서를 수정하여 다시 제출해 주세요."
            : "지원 부문과 지원 동기를 작성해 제출하면 모집글 작성자에게 전달됩니다."}
        </p>
      </div>

      {isRevisionMode && existingApplication.feedback && (
        <Callout variant="revision" title="작성자의 보완 요청 내용">
          {existingApplication.feedback}
        </Callout>
      )}

      {currentUser && (
        <div className={styles.fieldGroup}>
          <span className={styles.label}>지원자 기본 정보</span>
          <div className={styles.profileGrid}>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>이름</span>
              <strong className={styles.profileValue}>{currentUser.name}</strong>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>학번</span>
              <strong className={styles.profileValue}>
                {currentUser.studentId}
              </strong>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>소속 학과</span>
              <strong className={styles.profileValue}>{currentUser.dept}</strong>
            </div>
          </div>
        </div>
      )}

      {errorMsg && <Callout variant="danger">{errorMsg}</Callout>}

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          지원 부문 선택 <span className={styles.required}>*</span>
        </label>
        <div className={styles.deptRadioGrid}>
          {post.departments.map((dept) => {
            const isFull = isDeptFull(dept);
            const isSelected = targetDept === dept.deptName;
            return (
              <label
                key={dept.deptName}
                className={`${styles.deptRadioCard} ${
                  isSelected ? styles.deptRadioSelected : ""
                } ${isFull ? styles.deptRadioDisabled : ""}`}
              >
                <input
                  type="radio"
                  name="targetDept"
                  value={dept.deptName}
                  disabled={isFull}
                  checked={isSelected}
                  onChange={(e) => setTargetDept(e.target.value)}
                />
                <div className={styles.deptRadioText}>
                  <span className={styles.deptRadioName}>{dept.deptName}</span>
                  <span className={styles.deptRadioMeta}>
                    {dept.currentMembers} / {dept.maxMembers}명{" "}
                    {isFull ? "(마감)" : "모집중"}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="message">
            지원 동기 및 자기소개 <span className={styles.required}>*</span>
          </label>
          <span className={styles.charCount}>{message.length}자</span>
        </div>
        <textarea
          id="message"
          rows={6}
          className={styles.textarea}
          placeholder="간단한 자기소개, 가능한 역할 및 지원 동기를 작성해 주세요."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className={styles.formActions}>
        {isRevisionMode ? (
          <Button
            variant="danger"
            size="lg"
            disabled={canceling || submitting}
            onClick={() => onCancel(existingApplication.id)}
          >
            지원 취소
          </Button>
        ) : (
          <Button as="a" href="/" variant="secondary" size="lg">
            ← 목록으로 돌아가기
          </Button>
        )}
        <Button type="submit" variant="primary" size="lg" disabled={submitting}>
          {submitting
            ? "제출 중..."
            : isRevisionMode
            ? "보완 내용 제출"
            : "지원서 제출하기"}
        </Button>
      </div>
    </form>
  );
}

export default ApplicationForm;
