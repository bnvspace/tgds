import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import styles from './StartScreen.module.css'

export default function StartScreen() {
  const startRun = useGameStore((s) => s.startRun)
  const setPhase = useGameStore((s) => s.setPhase)
  const setLanguage = useGameStore((s) => s.setLanguage)
  const { t, lang } = useTranslation()

  function toggleLang() {
    setLanguage(lang === 'ru' ? 'en' : 'ru')
  }

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button 
        className={styles.langBtn} 
        onClick={toggleLang}
        style={{ position: 'absolute', top: 16, right: 16, background: '#12121e', color: '#c8a96e', border: '2px solid #3d2b1f', padding: '8px', cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
      >
        {lang === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
      </button>

      <div className={styles.logo}>
        <h1 className={styles.title}>SLOT</h1>
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
        <button className={styles.btnPrimary} onClick={startRun}>
          ▶ {t('start_run')}
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
