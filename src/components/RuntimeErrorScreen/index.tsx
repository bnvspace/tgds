import styles from './RuntimeErrorScreen.module.css'

export default function RuntimeErrorScreen() {
  function reloadApp() {
    window.location.reload()
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Something Went Wrong</h1>
      <p className={styles.copy}>Reload and jump back into the run.</p>
      <button type="button" className={styles.button} onClick={reloadApp}>
        RELOAD
      </button>
    </div>
  )
}
