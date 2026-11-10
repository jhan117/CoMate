import { useCallback, useEffect, useState } from 'react'
import { deletePost, fetchPosts, savePost } from '../api/postApi'
import AuthBar from './AuthBar'
import Button from './common/Button'
import Callout from './common/Callout'
import PostCard from './PostCard'
import PostForm from './PostForm'
import styles from './Body.module.css'

const baseCategories = ['대회', '공모전', '해커톤', '팀플', '스터디']

export default function Body() {
  const [posts, setPosts] = useState([])
  const [user, setUser] = useState(null)
  const userId = user?.id
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [department, setDepartment] = useState('')
  const [editor, setEditor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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

const changeUser = useCallback((nextUser) => {
  setUser(nextUser)
  setEditor(null)
  setError('')
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
    setError('')
    setEditor(post)
  }

  async function save(fields) {
    setBusy(true)
    setError('')

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
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(post) {
    if (!window.confirm(`‘${post.title}’ 모집글을 삭제할까요?`)) return

    setBusy(true)
    setError('')

    try {
      await deletePost(post.id)
      setPosts((previous) => previous.filter((item) => item.id !== post.id))
      if (editor?.id === post.id) setEditor(null)
      setDepartment('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.body}>
      <AuthBar user={user} onUserChange={changeUser} disabled={busy} />
      <div className={styles.crudHeading}>
        <h2 className={styles.title}>팀원 모집 게시판</h2>
        {userId && (
          <Button variant="primary" disabled={busy} onClick={() => openEditor({})}>
            + 모집글 작성
          </Button>
        )}
      </div>

      <div className={styles.crudRow}>
        <label>
          제목·내용 검색
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label>
          분류
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">전체</option>
            {categories.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label>
          모집 학과
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">전체</option>
            {departments.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        
      </div>

      {error && <div role="alert"><Callout variant="danger">{error}</Callout></div>}
      {editor && (
        <PostForm
          key={editor.id ?? 'new'}
          post={editor.id ? editor : null}
          categories={categories}
          busy={busy}
          onSave={save}
          onCancel={() => setEditor(null)}
        />
      )}

      {loading && <p>모집글을 불러오는 중입니다…</p>}
      {!loading && !error && visiblePosts.length === 0 && <p>조건에 맞는 모집글이 없습니다.</p>}

      <section className={styles.crudGrid} aria-label="모집글 목록">
        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            canEdit={userId === post.authorId}
            busy={busy}
            onEdit={() => openEditor(post)}
            onDelete={() => remove(post)}
          />
        ))}
      </section>
    </main>
  )
}