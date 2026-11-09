import { useEffect, useState } from 'react'
import { fetchCurrentUser, login, logout, signup } from '../api/authApi'
import Button from './common/Button'
import Callout from './common/Callout'
import styles from './Body.module.css'

export default function AuthBar({ user, onUserChange, disabled }) {
  const [mode, setMode] = useState('login')
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const signingUp = mode === 'signup'

  useEffect(() => {
    let active = true

    fetchCurrentUser()
      .then((currentUser) => {
        if (active) onUserChange(currentUser)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => { active = false }
  }, [onUserChange])

  async function submit(event) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))

    if (signingUp && fields.password !== fields.passwordConfirmation) {
      setError('비밀번호가 서로 일치하지 않습니다.')
      return
    }

    const credentials = {
      studentId: fields.studentId,
      password: fields.password,
    }

    setBusy(true)
    setError('')

    try {
      const currentUser = signingUp
        ? await signup({ ...credentials, name: fields.name, dept: fields.dept })
        : await login(credentials)

      onUserChange(currentUser)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    setError('')

    try {
      await logout()
      setMode('login')
      onUserChange(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (checking) return <p>로그인 상태를 확인하고 있습니다…</p>

  return (
    <section className={styles.crudForm} aria-label="회원 인증">
      {error && <div role="alert"><Callout variant="danger">{error}</Callout></div>}

      {user ? (
        <div className={styles.crudActions}>
          <strong>{user.name}님</strong>
          <span>{user.dept}</span>
          <Button type="button" disabled={busy || disabled} onClick={signOut}>
            로그아웃
          </Button>
        </div>
      ) : (
        <form key={mode} onSubmit={submit}>
          <h2>{signingUp ? '회원가입' : '로그인'}</h2>

          <fieldset className={styles.crudFields} disabled={busy || disabled}>
            <div className={styles.crudRow}>
              <label>
                학번
                <input name="studentId" required inputMode="numeric" pattern="[0-9]{8}"
                  maxLength={8} autoComplete="username" />
              </label>
              <label>
                비밀번호
                <input name="password" type="password" required maxLength={128}
                  minLength={signingUp ? 8 : undefined}
                  autoComplete={signingUp ? 'new-password' : 'current-password'} />
              </label>
            </div>

            {signingUp && (
              <div className={styles.crudRow}>
                <label>
                  이름
                  <input name="name" required maxLength={50} autoComplete="name" />
                </label>
                <label>
                  학과
                  <input name="dept" required maxLength={100} />
                </label>
                <label>
                  비밀번호 확인
                  <input name="passwordConfirmation" type="password" required
                    maxLength={128} autoComplete="new-password" />
                </label>
              </div>
            )}

            <div className={styles.crudActions}>
              <Button type="submit" variant="primary">
                {signingUp ? '가입하기' : '로그인'}
              </Button>
              <Button type="button" onClick={() => {
                setError('')
                setMode(signingUp ? 'login' : 'signup')
              }}>
                {signingUp ? '로그인으로 돌아가기' : '회원가입'}
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  )
}