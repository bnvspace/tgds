import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import { playButtonSFX, primeAudioPlayback } from '@/utils/audio'
import { haptics } from '@/utils/haptics'
import styles from './SettingsScreen.module.css'

export default function SettingsScreen() {
  const setPhase = useGameStore((s) => s.setPhase)
  const setLanguage = useGameStore((s) => s.setLanguage)
  const toggleMute = useGameStore((s) => s.toggleMute)
  const toggleHaptics = useGameStore((s) => s.toggleHaptics)
  const meta = useGameStore((s) => s.meta)
  const { t, lang } = useTranslation()

  const hapticsEnabled = meta.isHapticsEnabled !== false

  function handleBack() {
    playButtonSFX()
    haptics.button()
    setPhase('meta_menu')
  }

  function handleSoundToggle() {
    primeAudioPlayback()
    playButtonSFX()
    toggleMute()
  }

  function handleHapticsToggle() {
    playButtonSFX()
    toggleHaptics()
  }

  function handleLanguageChange(nextLang: 'en' | 'ru') {
    playButtonSFX()
    haptics.selectionChange()
    setLanguage(nextLang)
  }

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          {'<-'} {t('close')}
        </button>
        <h2 className={styles.title}>{t('settings')}</h2>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.list}>
        <section className={styles.card}>
          <div className={styles.row}>
            <div>
              <p className={styles.label}>{t('sound')}</p>
              <p className={styles.value}>{meta.isMuted ? t('off') : t('on')}</p>
            </div>
            <button className={styles.toggleBtn} onClick={handleSoundToggle}>
              {meta.isMuted ? t('off') : t('on')}
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.row}>
            <div>
              <p className={styles.label}>{t('vibration')}</p>
              <p className={styles.value}>{hapticsEnabled ? t('on') : t('off')}</p>
            </div>
            <button className={styles.toggleBtn} onClick={handleHapticsToggle}>
              {hapticsEnabled ? t('on') : t('off')}
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <p className={styles.label}>{t('language')}</p>
          <div className={styles.languageRow}>
            <button
              className={`${styles.languageBtn} ${lang === 'ru' ? styles.languageBtnActive : ''}`}
              onClick={() => handleLanguageChange('ru')}
            >
              {t('russian')}
            </button>
            <button
              className={`${styles.languageBtn} ${lang === 'en' ? styles.languageBtnActive : ''}`}
              onClick={() => handleLanguageChange('en')}
            >
              {t('english')}
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  )
}
