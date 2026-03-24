import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import { playButtonSFX, primeAudioPlayback } from '@/utils/audio'
import { haptics } from '@/utils/haptics'
import styles from './StartScreen.module.css'

export default function StartScreen() {
  const startRun = useGameStore((s) => s.startRun)
  const setPhase = useGameStore((s) => s.setPhase)
  const { t, lang } = useTranslation()

  function handleStartRun() {
    primeAudioPlayback()
    haptics.action()
    playButtonSFX()
    startRun()
  }

  function handleOpenModifiers() {
    haptics.button()
    playButtonSFX()
    setPhase('modifiers')
  }

  function handleOpenLeaderboard() {
    haptics.button()
    playButtonSFX()
    setPhase('leaderboard')
  }

  function handleOpenSettings() {
    haptics.button()
    playButtonSFX()
    setPhase('settings')
  }

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.logo}>
        <h1 className={styles.title}>GIFT'S</h1>
        <span className={styles.ampersand}>&amp;</span>
        <h1 className={styles.title}>DAGGERS</h1>
      </div>

      <p className={styles.subtitle}>
        {lang === 'ru' ? (
          <>
            Соберите свои барабаны.<br />
            Покорите подземелье.
          </>
        ) : (
          <>
            Build your reel.<br />
            Beat the dungeon.
          </>
        )}
      </p>

      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={handleStartRun}>
          {'>'} {t('start_run')}
        </button>
        <button className={styles.btnSecondary} onClick={handleOpenModifiers}>
          {t('modifiers_title')}
        </button>
        <button className={styles.btnSecondary} onClick={handleOpenLeaderboard}>
          {t('leaderboard')}
        </button>
        <button className={styles.btnSecondary} onClick={handleOpenSettings}>
          {t('settings')}
        </button>
      </div>

      <p className={styles.version}>v0.3-alpha</p>
    </motion.div>
  )
}
