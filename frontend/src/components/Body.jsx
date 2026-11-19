import { useCallback, useEffect, useState } from 'react'
import { deletePost, fetchPosts, savePost } from '../api/postApi'
import Button from './common/Button'
import Callout from './common/Callout'
import ConfirmModal from './common/ConfirmModal'
import PostCard from './post/PostCard'
import PostFilters from './post/PostFilters'
import PostForm from './post/PostForm'
import styles from './Body.module.css'

const baseCategories = ['대회', '공모전', '해커톤', '팀플', '스터디']

export default function Body({ user, authLoading }) {
  const [posts, setPosts] = useState([])
  const userId = user?.id
  const [prevUserId, setPrevUserId] = useState(userId)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [department, setDepartment] = useState('')
  const [editor, setEditor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  if (prevUserId !== userId) {
    setPrevUserId(userId)
    setEditor(null)
    setDeleteTarget(null)
    setError('')
    setFormError('')
  }

  useEffect(() => {
    let active = true

    fetchPosts()
      .then((data) => {
        if (active) setPosts(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const categories = [...new Set([...baseCategories, ...posts.map((post) => post.category)])]
  const departments = [...new Set(
    posts.flatMap((post) => post.departments.map((dept) => dept.deptName)),
  )].sort((a, b) => a.localeCompare(b, 'ko'))

  const keyword = query.trim().toLowerCase()
  const visiblePosts = posts.filter((post) =>
    (!category || post.category === category) &&
    (!department || post.departments.some((dept) => dept.deptName === department)) &&
    `${post.title} ${post.content ?? ''}`.toLowerCase().includes(keyword),
  )

  function openEditor(post) {
    setFormError('')
    setEditor(post)
  }

  const closeEditor = useCallback(() => {
    setFormError('')
    setEditor(null)
  }, [])

  async function save(fields) {
    setBusy(true)
    setFormError('')

    try {
      const saved = await savePost(editor.id, fields)
      setPosts((previous) => editor.id
        ? previous.map((post) => post.id === saved.id ? saved : post)
        : [saved, ...previous],
      )
      setQuery('')
      setCategory('')
      setDepartment('')
      setEditor(null)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return

    setBusy(true)
    setError('')

    try {
      await deletePost(deleteTarget.id)
      setPosts((previous) => previous.filter((item) => item.id !== deleteTarget.id))
      if (editor?.id === deleteTarget.id) setEditor(null)
      setDepartment('')
      setDeleteTarget(null)
    } catch (err) {
      setError(err.message)
      setDeleteTarget(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.body}>
      <div className={styles.crudHeading}>
        <h2 className={styles.title}>팀원 모집 게시판</h2>
        {!authLoading && userId && (
          <Button variant="primary" disabled={busy} onClick={() => openEditor({})}>
            + 모집글 작성
          </Button>
        )}
      </div>

      <PostFilters
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        department={department}
        onDepartmentChange={setDepartment}
        categories={categories}
        departments={departments}
      />

      {!authLoading && !userId && (
        <Callout variant="neutralBordered" size="compact" className={styles.loginNotice}>
          모집글 작성과 팀원 지원은 상단 로그인 후 이용할 수 있습니다.
        </Callout>
      )}

      {error && (
        <div role="alert">
          <Callout variant="danger" onClose={() => setError('')}>
            {error}
          </Callout>
        </div>
      )}
      {editor && (
        <PostForm
          key={editor.id ?? 'new'}
          post={editor.id ? editor : null}
          categories={categories}
          busy={busy}
          error={formError}
          onClearError={() => setFormError('')}
          onSave={save}
          onCancel={closeEditor}
        />
      )}

      {loading && <p>모집글을 불러오는 중입니다…</p>}
      {!loading && !error && visiblePosts.length === 0 && <p>조건에 맞는 모집글이 없습니다.</p>}

      <section className={styles.crudGrid} aria-label="모집글 목록">
        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isLoggedIn={Boolean(userId)}
            canEdit={Boolean(userId) && userId === post.authorId}
            busy={busy}
            onEdit={() => openEditor(post)}
            onDelete={() => setDeleteTarget(post)}
          />
        ))}
      </section>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="모집글 삭제"
        description="이 모집글을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다."
        preview={deleteTarget?.title || ''}
        confirmLabel="삭제"
        cancelLabel="취소"
        confirmVariant="dangerSolid"
        busy={busy}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  )
}