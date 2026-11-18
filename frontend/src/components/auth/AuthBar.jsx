import { useEffect, useState } from 'react'
import { login, logout, signup } from '../../api/authApi'
import Button from '../common/Button'
import Callout from '../common/Callout'
import styles from './AuthBar.module.css'

export default function AuthBar({ user, onUserChange, authLoading }) {
  const [mode, setMode] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const signingUp = mode === 'signup'

  function closeModal() {
    if (busy) return
    setMode(null)
    setError('')
  }

  function openModal(nextMode) {
    setError('')
    setMode(nextMode)
  }

  useEffect(() => {
    if (!mode) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode, busy])

  async function submit(event) {
    event.preventDefault()

    const fields = Object.fromEntries(
      new FormData(event.currentTarget)
    )

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
        ? await signup({
            ...credentials,
            name: fields.name,
            dept: fields.dept,
          })
        : await login(credentials)

      onUserChange(currentUser)
      setMode(null)
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
      onUserChange(null)
      setMode(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className={styles.authActions}>
        {authLoading ? (
          <span className={styles.loading}>
            로그인 확인 중…
          </span>
        ) : user ? (
          <>
            <span className={styles.userName}>
              {user.name}님
            </span>

            <button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={signOut}
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="secondary"
              onClick={() => openModal('login')}
            >
              로그인
            </button>

            <button
              type="button"
              className="primary"
              onClick={() => openModal('signup')}
            >
              회원가입
            </button>
          </>
        )}
      </div>

      {!mode && error && (
        <div role="alert">
          <Callout variant="error" className={styles.headerError}>
            {error}
          </Callout>
        </div>
      )}

      {mode && (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={signingUp ? '회원가입' : '로그인'}
          >
            <div className={styles.modalHeader}>
              <h2>
                {signingUp ? '회원가입' : '로그인'}
              </h2>

              <button
                type="button"
                className={styles.closeButton}
                disabled={busy}
                onClick={closeModal}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            {error && (
              <div role="alert">
                <Callout variant="error" className={styles.error}>
                  {error}
                </Callout>
              </div>
            )}

            <form key={mode} onSubmit={submit}>
              <fieldset
                className={styles.fields}
                disabled={busy}
              >
                <label className={styles.field}>
                  학번
                  <input
                    name="studentId"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    autoComplete="username"
                  />
                </label>

                <label className={styles.field}>
                  비밀번호
                  <input
                    name="password"
                    type="password"
                    required
                    maxLength={128}
                    minLength={signingUp ? 8 : undefined}
                    autoComplete={
                      signingUp
                        ? 'new-password'
                        : 'current-password'
                    }
                  />
                </label>

                {signingUp && (
                  <>
                    <label className={styles.field}>
                      이름
                      <input
                        name="name"
                        required
                        maxLength={50}
                        autoComplete="name"
                      />
                    </label>

                    <label className={styles.field}>
                      학과
                      <input
                        name="dept"
                        required
                        maxLength={100}
                      />
                    </label>

                    <label className={styles.field}>
                      비밀번호 확인
                      <input
                        name="passwordConfirmation"
                        type="password"
                        required
                        maxLength={128}
                        autoComplete="new-password"
                      />
                    </label>
                  </>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className={styles.submitButton}
                >
                  {busy
                    ? '처리 중…'
                    : signingUp
                      ? '가입하기'
                      : '로그인'}
                </Button>
              </fieldset>
            </form>

            <div className={styles.switchMode}>
              <span>
                {signingUp
                  ? '이미 계정이 있으신가요?'
                  : '아직 계정이 없으신가요?'}
              </span>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  openModal(signingUp ? 'login' : 'signup')
                }
              >
                {signingUp ? '로그인' : '회원가입'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
