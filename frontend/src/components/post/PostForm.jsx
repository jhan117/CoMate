import { useState } from 'react'
import Button from '../common/Button'
import Callout from '../common/Callout'
import Modal from '../common/Modal'
import styles from './PostForm.module.css'

const emptyDepartment = { deptName: '', maxMembers: '1' }

export default function PostForm({
  post,
  categories,
  busy,
  error = '',
  onClearError,
  onSave,
  onCancel,
}) {
  const [fields, setFields] = useState(() => ({
    title: post?.title ?? '',
    category: post?.category ?? categories[0],
    content: post?.content ?? '',
    deadline: post?.deadline ?? '',
    departments: post?.departments ?? [emptyDepartment],
  }))

  function change(name, value) {
    setFields((previous) => ({ ...previous, [name]: value }))
  }

  function changeDepartment(index, name, value) {
    setFields((previous) => ({
      ...previous,
      departments: previous.departments.map((dept, i) =>
        i === index ? { ...dept, [name]: value } : dept,
      ),
    }))
  }

  function submit(event) {
    event.preventDefault()
    onSave({
      ...fields,
      departments: fields.departments.map(({ deptName, maxMembers }) => ({
        deptName,
        maxMembers: Number(maxMembers),
      })),
    })
  }

  const modalTitle = post ? '모집글 수정' : '새 모집글 작성'

  return (
    <Modal
      title={modalTitle}
      maxWidth={560}
      busy={busy}
      onClose={onCancel}
    >
      {error && (
        <div role="alert" className={styles.error}>
          <Callout variant="danger" size="compact" onClose={onClearError}>
            {error}
          </Callout>
        </div>
      )}

        <form onSubmit={submit}>
          <fieldset className={styles.fields} disabled={busy}>
            <label className={styles.field}>
              제목
              <input
                required
                value={fields.title}
                placeholder="예: 2026 교내 해커톤 팀원 모집"
                onChange={(e) => change('title', e.target.value)}
              />
            </label>

            <div className={styles.rowGrid}>
              <label className={styles.field}>
                분류
                <select value={fields.category} onChange={(e) => change('category', e.target.value)}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className={styles.field}>
                마감일
                <input
                  type="date"
                  required
                  value={fields.deadline}
                  onChange={(e) => change('deadline', e.target.value)}
                />
              </label>
            </div>

            <label className={styles.field}>
              모집 안내
              <textarea
                rows={4}
                value={fields.content}
                placeholder="프로젝트 주제, 진행 방식, 찾는 역할 등을 적어주세요."
                onChange={(e) => change('content', e.target.value)}
              />
            </label>

            <div className={styles.deptSection}>
              <div className={styles.deptHeader}>
                <span className={styles.deptHeading}>학과별 모집 인원</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => change('departments', [...fields.departments, emptyDepartment])}
                >
                  + 학과 추가
                </Button>
              </div>

              <div className={styles.deptList}>
                {fields.departments.map((dept, index) => (
                  <div key={index} className={styles.deptRow}>
                    <label className={`${styles.field} ${styles.deptField}`}>
                      학과 {index + 1}
                      <input
                        required
                        value={dept.deptName}
                        placeholder="예: 컴퓨터공학과, 학과 무관"
                        onChange={(e) => changeDepartment(index, 'deptName', e.target.value)}
                      />
                    </label>
                    <label className={`${styles.field} ${styles.countField}`}>
                      정원
                      <input
                        type="number"
                        required
                        min={1}
                        step={1}
                        value={dept.maxMembers}
                        onChange={(e) => changeDepartment(index, 'maxMembers', e.target.value)}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className={styles.removeButton}
                      disabled={fields.departments.length === 1}
                      onClick={() => change('departments', fields.departments.filter((_, i) => i !== index))}
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
                취소
              </Button>
              <Button type="submit" variant="primary" disabled={busy}>
                {busy ? '저장 중…' : post ? '수정 저장' : '작성 완료'}
              </Button>
            </div>
          </fieldset>
        </form>
    </Modal>
  )
}