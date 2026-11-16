import { useLayoutEffect, useRef } from 'react'
import Button from './common/Button'
import card from './PostCard.module.css'

function deadlineLabel(deadline) {
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
  }).format(new Date())

  const days = (Date.parse(deadline) - Date.parse(today)) / 86400000
  if (days < 0) return '마감'
  return days === 0 ? 'D-day' : `D-${days}`
}

export default function PostCard({ post, canEdit, busy, onEdit, onDelete }) {
  const detailUrl = `/posts/${encodeURIComponent(post.id)}/application`
    const cardRef = useRef(null)

  useLayoutEffect(() => {
    const element = cardRef.current
    if (!element) return

    const updateHeight = () => {
      const grid = element.parentElement
      if (!grid) return

      const styles = window.getComputedStyle(grid)
      const rowHeight = parseFloat(styles.gridAutoRows)
      const rowGap = parseFloat(styles.rowGap)

      if (!rowHeight || !Number.isFinite(rowGap)) return

      const height = element.getBoundingClientRect().height
      const span = Math.ceil((height + rowGap) / (rowHeight + rowGap))

      element.style.gridRowEnd = `span ${span}`
    }

    const observer = new ResizeObserver(updateHeight)
    observer.observe(element)
    updateHeight()

    return () => observer.disconnect()
  }, [])

  return (
    <article ref={cardRef} className={card.sidebarCard}>
      <a
        href={detailUrl}
        className={card.cardLink}
        aria-label={`${post.title} 지원 페이지 보기`}
      />
      <div className={card.sidebarBadgeRow}>
        <span className={card.categoryBadge}>{post.category}</span>
        <time className={card.deadlineText} dateTime={post.deadline}>
          {deadlineLabel(post.deadline)} · {post.deadline}
        </time>
      </div>

      <h2 className={card.sidebarTitle}>{post.title}</h2>
      <p className={card.sidebarAuthor}>모집 팀장 <strong>{post.author}</strong></p>

      <ul className={card.sidebarQuotaList}>
        {post.departments.map(({ deptName, currentMembers, maxMembers }) => (
          <li key={deptName} className={card.sidebarQuotaItem}>
            <div className={card.sidebarQuotaTop}>
              <span className={card.deptName}>{deptName}</span>
              <span className={card.memberRatio}>{currentMembers} / {maxMembers}명</span>
            </div>
          </li>
        ))}
      </ul>

      <div className={card.cardActions}>
        {canEdit && (
          <>
            <Button size="sm" disabled={busy} onClick={onEdit}>수정</Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={onDelete}>삭제</Button>
          </>
        )}
      </div>
    </article>
  )
}