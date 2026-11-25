import { useLayoutEffect, useRef } from 'react'
import { getDeadlineMeta } from '../../utils/applicationUtils'
import Button from '../common/Button'
import card from './PostCard.module.css'

export default function PostCard({ post, isLoggedIn, canEdit, busy, onEdit, onDelete }) {
  const detailUrl = `/posts/${encodeURIComponent(post.id)}/application`
  const deadlineMeta = getDeadlineMeta(post.deadline)
  const isFull = post.departments.length > 0 &&
    post.departments.every((dept) => dept.currentMembers >= dept.maxMembers)
  const isClosed = deadlineMeta.isClosed || isFull
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
    <article ref={cardRef} className={card.card}>
      <div className={card.badgeRow}>
        <span className={card.categoryBadge}>{post.category}</span>
        <div className={card.deadlineGroup}>
          {isFull ? (
            <span className={`${card.deadlineBadge} ${card.closed}`}>
              정원 마감
            </span>
          ) : deadlineMeta.label && (
            <span className={`${card.deadlineBadge} ${card[deadlineMeta.variant]}`}>
              {deadlineMeta.label}
            </span>
          )}
          <time className={card.deadlineText} dateTime={post.deadline}>
            {post.deadline}
          </time>
        </div>
      </div>

      <h2 className={card.title}>{post.title}</h2>
      <p className={card.author}>모집 팀장 <strong>{post.author}</strong></p>

      {post.content && (
        <div className={card.contentSection}>
          <strong>모집 상세 안내</strong>
          <p>{post.content}</p>
        </div>
      )}

      <ul className={card.quotaList}>
        {post.departments.map(({ deptName, currentMembers, maxMembers }) => (
          <li key={deptName} className={card.quotaItem}>
            <div className={card.quotaTop}>
              <span className={card.deptName}>{deptName}</span>
              <span className={card.memberRatio}>{currentMembers} / {maxMembers}명</span>
            </div>
          </li>
        ))}
      </ul>

      {isLoggedIn && (
        <div className={card.cardActions}>
          {canEdit ? (
            <>
              <Button as="a" href={detailUrl} variant="revision" size="sm">
                지원자 관리
              </Button>
              <div className={card.ownerActions}>
                <Button size="sm" disabled={busy} onClick={onEdit}>수정</Button>
                <Button size="sm" variant="danger" disabled={busy} onClick={onDelete}>삭제</Button>
              </div>
            </>
          ) : (
            <Button
              as="a"
              href={detailUrl}
              variant={isClosed ? 'secondary' : 'revision'}
              size="sm"
              className={card.applicantAction}
            >
              {isFull ? '정원 마감' : isClosed ? '현황 보기' : '지원하기'}
            </Button>
          )}
        </div>
      )}
    </article>
  )
}