import Header from './components/Header'
import Body from './components/Body'
import Footer from './components/Footer'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.app}>
      <Header />
      <Body />
      <Footer />
    </div>
  )
}

export default App
