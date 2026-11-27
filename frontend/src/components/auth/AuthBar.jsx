import { useCallback, useState } from 'react'
import { login, logout, signup } from '../../api/authApi'
import Button from '../common/Button'
import Callout from '../common/Callout'
import Modal from '../common/Modal'
import styles from './AuthBar.module.css'

export default function AuthBar({ user, onUserChange, authLoading }) {
  const [mode, setMode] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const userId = user?.id
  const [prevUserId, setPrevUserId] = useState(userId)

  if (prevUserId !== userId) {
    setPrevUserId(userId)
    if (user) {
      setMode(null)
      setError('')
    }
  }

  const signingUp = mode === 'signup'

  const closeModal = useCallback(() => {
    if (busy) return
    setMode(null)
    setError('')
  }, [busy])

  function openModal(nextMode) {
    setError('')
    setMode(nextMode)
  }

  async function submit(event) {
    event.preventDefault()

    const fields = Object.fromEntries(
      new FormData(event.currentTarget)
    )

    if (signingUp && !fields.name.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }

    if (signingUp && !fields.dept.trim()) {
      setError('학과를 입력해 주세요.')
      return
    }

    if (signingUp && fields.password !== fields.passwordConfirmation) {
      setError('비밀번호가 서로 일치하지 않습니다.')
      return
    }

    const credentials = {
      email: fields.email,
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
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={signOut}
          >
            로그아웃
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => openModal('login')}
            >
              로그인
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => openModal('signup')}
            >
              회원가입
            </Button>
          </>
        )}
      </div>

      {!mode && error && (
        <div role="alert">
          <Callout
            variant="danger"
            size="compact"
            className={styles.headerError}
            onClose={() => setError('')}
          >
            {error}
          </Callout>
        </div>
      )}

      <Modal
        open={Boolean(mode)}
        title={signingUp ? '회원가입' : '로그인'}
        maxWidth={420}
        busy={busy}
        onClose={closeModal}
      >

            {error && (
              <div role="alert">
                <Callout
                  variant="danger"
                  size="compact"
                  className={styles.error}
                  onClose={() => setError('')}
                >
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
                  이메일
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    placeholder="example@email.com"
                    autoComplete="email"
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
                    placeholder={signingUp ? '8자 이상 입력해 주세요.' : '비밀번호를 입력해 주세요.'}
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
                        minLength={8}
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
      </Modal>
    </>
  )
}
