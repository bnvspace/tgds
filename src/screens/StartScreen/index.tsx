import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { startScreenBackdrop } from '@/assets/pixelArt'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import { playButtonSFX, primeAudioPlayback } from '@/utils/audio'
import { haptics } from '@/utils/haptics'
import styles from './StartScreen.module.css'

export default function StartScreen() {
  const startRun = useGameStore((s) => s.startRun)
  const setPhase = useGameStore((s) => s.setPhase)
  const meta = useGameStore((s) => s.meta)
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

  const screenStyle = {
    '--start-backdrop': `url("${startScreenBackdrop}")`,
  } as CSSProperties
  const textLocale = lang === 'ru' ? 'ru-RU' : 'en-US'

  function menuCaps(value: string) {
    return value.toLocaleUpperCase(textLocale)
  }

  return (
    <motion.div
      className={styles.screen}
      style={screenStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <section className={styles.heroPanel}>
        <div className={styles.statusRow}>
          <span className={styles.statusChip}>
            {meta.totalChips} {t('chips')}
          </span>
          <span className={styles.statusChip}>
            {t('sound')}: {t(meta.isMuted ? 'off' : 'on')}
          </span>
          <span className={styles.statusChip}>
            {t('vibration')}: {t(meta.isHapticsEnabled === false ? 'off' : 'on')}
          </span>
        </div>

        <div className={styles.logo}>
          <h1 className={styles.title}>GIFT&apos;S</h1>
          <span className={styles.ampersand}>&amp;</span>
          <h1 className={styles.title}>DAGGERS</h1>
        </div>

        <p className={styles.subtitle}>
          {lang === 'ru' ? (
            <>
              Соберите свои барабаны.
              <br />
              Покорите подземелье.
            </>
          ) : (
            <>
              Build your reel.
              <br />
              Beat the dungeon.
            </>
          )}
        </p>
      </section>

      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={handleStartRun}>
          {'>'} {t('start_run')}
        </button>

        <div className={styles.secondaryGrid}>
          <button className={styles.btnSecondary} onClick={handleOpenModifiers}>
            {menuCaps(t('modifiers_title'))}
          </button>
          <button className={styles.btnSecondary} onClick={handleOpenLeaderboard}>
            {t('leaderboard')}
          </button>
          <button className={styles.btnSecondary} onClick={handleOpenSettings}>
            {t('settings')}
          </button>
        </div>
      </div>

      <p className={styles.version}>v0.3-alpha</p>
    </motion.div>
  )
}
