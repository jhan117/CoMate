import { useState } from 'react'
import Button from './common/Button'
import styles from './Body.module.css'

const emptyDepartment = { deptName: '', maxMembers: '1' }

export default function PostForm({ post, categories, busy, onSave, onCancel }) {
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

  return (
    <form className={styles.crudForm} onSubmit={submit}>
      <h2>{post ? '모집글 수정' : '새 모집글 작성'}</h2>

      <fieldset className={styles.crudFields} disabled={busy}>
        <label>
          제목
          <input required value={fields.title} onChange={(e) => change('title', e.target.value)} />
        </label>

        <div className={styles.crudRow}>
          <label>
            분류
            <select value={fields.category} onChange={(e) => change('category', e.target.value)}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>
            마감일
            <input type="date" required value={fields.deadline}
              onChange={(e) => change('deadline', e.target.value)} />
          </label>
        </div>

        <label>
          모집 안내
          <textarea rows={3} value={fields.content} onChange={(e) => change('content', e.target.value)} />
        </label>

        <fieldset className={styles.crudFields}>
          <legend>학과별 모집 인원</legend>
          {fields.departments.map((dept, index) => (
            <div key={index} className={styles.crudRow}>
              <label>
                학과 {index + 1}
                <input required value={dept.deptName} placeholder="예: 컴퓨터공학과, 학과 무관"
                  onChange={(e) => changeDepartment(index, 'deptName', e.target.value)} />
              </label>
              <label>
                정원
                <input type="number" required min={1} step={1} value={dept.maxMembers}
                  onChange={(e) => changeDepartment(index, 'maxMembers', e.target.value)} />
              </label>
              <Button type="button" size="sm" disabled={fields.departments.length === 1}
                onClick={() => change('departments', fields.departments.filter((_, i) => i !== index))}>
                부문 삭제
              </Button>
            </div>
          ))}
          <div>
            <Button type="button" size="sm"
              onClick={() => change('departments', [...fields.departments, emptyDepartment])}>
              + 학과 추가
            </Button>
          </div>
        </fieldset>

        <div className={styles.crudActions}>
          <Button type="button" onClick={onCancel}>취소</Button>
          <Button type="submit" variant="primary">{busy ? '저장 중…' : '저장'}</Button>
        </div>
      </fieldset>
    </form>
  )
}