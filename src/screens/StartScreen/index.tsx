import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import styles from './StartScreen.module.css'

export default function StartScreen() {
  const startRun = useGameStore((s) => s.startRun)
  const setPhase = useGameStore((s) => s.setPhase)

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.logo}>
        <h1 className={styles.title}>SLOT</h1>
        <span className={styles.ampersand}>&amp;</span>
        <h1 className={styles.title}>DAGGERS</h1>
      </div>

      <p className={styles.subtitle}>
        Build your reel.<br />
        Beat the dungeon.
      </p>

      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={startRun}>
          ▶ START RUN
        </button>
        <button
          className={styles.btnSecondary}
          onClick={() => setPhase('meta_menu')}
        >
          ⚙ MODIFIERS
        </button>
      </div>

      <p className={styles.version}>v0.3-alpha</p>
    </motion.div>
  )
}
