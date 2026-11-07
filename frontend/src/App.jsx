import Header from './components/Header'
import Body from './components/Body'
import Footer from './components/Footer'
import ApplicationPage from './pages/ApplicationPage'
import styles from './App.module.css'

function App() {
  const path = window.location.pathname
  const match = path.match(/^\/posts\/([^/]+)\/application\/?$/)

  return (
    <div className={styles.app}>
      <Header />
      {match ? <ApplicationPage postId={match[1]} /> : <Body />}
      <Footer />
    </div>
  )
}

export default App
