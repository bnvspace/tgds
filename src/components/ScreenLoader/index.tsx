import styles from './ScreenLoader.module.css'

export default function ScreenLoader() {
  return (
    <div className={styles.screen}>
      <span className={styles.label}>LOADING</span>
    </div>
  )
}
