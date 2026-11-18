import Header from './components/Header'
import Body from './components/Body'
import Footer from './components/Footer'
import ApplicationPage from './pages/ApplicationPage'
import MessagesPage from './pages/MessagesPage'
import styles from './App.module.css'

function App() {
  const path = window.location.pathname
  const applicationMatch = path.match(/^\/posts\/([^/]+)\/application\/?$/)
  const isMessagesPage = /^\/messages\/?$/.test(path)

  return (
    <div className={styles.app}>
      <Header />
      {applicationMatch ? (
        <ApplicationPage postId={applicationMatch[1]} />
      ) : isMessagesPage ? (
        <MessagesPage />
      ) : (
        <Body />
      )}
      <Footer />
    </div>
  )
}

export default App
