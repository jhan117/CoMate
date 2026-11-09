import Button from './common/Button'
import card from './application/PostSummaryCard.module.css'
import styles from './Body.module.css'

function deadlineLabel(deadline) {
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
  }).format(new Date())

  const days = (Date.parse(deadline) - Date.parse(today)) / 86400000
  if (days < 0) return '마감'
  return days === 0 ? 'D-day' : `D-${days}`
}

export default function PostCard({ post, canEdit, busy, onEdit, onDelete }) {
  return (
    <article className={card.sidebarCard}>
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

      <div className={styles.crudActions}>
        <Button as="a" href={`/posts/${encodeURIComponent(post.id)}/application`} size="sm">
          지원 페이지
        </Button>
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