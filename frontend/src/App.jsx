import { useCallback, useEffect, useState } from 'react'
import { fetchCurrentUser } from './api/authApi'
import { NOTIFICATION_EVENTS } from './constants/notificationConstants'
import Header from './components/Header'
import Body from './components/Body'
import Footer from './components/Footer'
import ApplicationPage from './pages/ApplicationPage'
import MessagesPage from './pages/MessagesPage'
import styles from './App.module.css'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const handleUserChange = useCallback((nextUser) => {
    setUser(nextUser)
  }, [])

  useEffect(() => {
    let active = true

    const handleUserChanged = (event) => {
      if (active) setUser(event.detail ?? null)
    }

    window.addEventListener(
      NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
      handleUserChanged
    )

    fetchCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch((error) => {
        console.error('로그인 상태 확인 실패:', error)
      })
      .finally(() => {
        if (active) setAuthLoading(false)
      })

    return () => {
      active = false
      window.removeEventListener(
        NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
        handleUserChanged
      )
    }
  }, [])

  const path = window.location.pathname
  const applicationMatch = path.match(/^\/posts\/([^/]+)\/application\/?$/)
  const isMessagesPage = /^\/messages\/?$/.test(path)

  return (
    <div className={styles.app}>
      <Header
        user={user}
        onUserChange={handleUserChange}
        authLoading={authLoading}
      />
      {applicationMatch ? (
        <ApplicationPage postId={applicationMatch[1]} />
      ) : isMessagesPage ? (
        <MessagesPage />
      ) : (
        <Body
          user={user}
          authLoading={authLoading}
        />
      )}
      <Footer />
    </div>
  )
}

export default App
