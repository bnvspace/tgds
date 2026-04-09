import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import type { ModifierId } from '@/types'
import { playButtonSFX, primeAudioPlayback } from '@/utils/audio'
import styles from './MetaMenu.module.css'

const MODIFIERS: Array<{
  id: ModifierId
  nameKey: string
  icon: string
  descKey: string
  chipsCost: number
  max: number
}> = [
  {
    id: 'health_core',
    nameKey: 'mod_health_name',
    icon: 'HP',
    descKey: 'mod_health_desc',
    chipsCost: 15,
    max: 5,
  },
  {
    id: 'damage_reduction',
    nameKey: 'mod_def_name',
    icon: 'ARM',
    descKey: 'mod_def_desc',
    chipsCost: 35,
    max: 3,
  },
  {
    id: 'physical_strength',
    nameKey: 'mod_str_name',
    icon: 'DMG',
    descKey: 'mod_str_desc',
    chipsCost: 30,
    max: 3,
  },
  {
    id: 'reel_slot',
    nameKey: 'mod_reel_name',
    icon: 'REEL',
    descKey: 'mod_reel_desc',
    chipsCost: 60,
    max: 3,
  },
  {
    id: 'token_collector',
    nameKey: 'mod_token_name',
    icon: 'COIN',
    descKey: 'mod_token_desc',
    chipsCost: 20,
    max: 3,
  },
  {
    id: 'extra_life',
    nameKey: 'mod_revive_name',
    icon: 'REV',
    descKey: 'mod_revive_desc',
    chipsCost: 50,
    max: 3,
  },
]

export default function MetaMenu() {
  const meta = useGameStore((s) => s.meta)
  const startRun = useGameStore((s) => s.startRun)
  const setPhase = useGameStore((s) => s.setPhase)
  const store = useGameStore()
  const { t, lang } = useTranslation()

  const [localMods, setLocalMods] = useState(() =>
    Object.fromEntries(MODIFIERS.map((m) => [
      m.id,
      meta.allocatedModifiers.find((a) => a.modifierId === m.id)?.count ?? 0,
    ]))
  )
  const [localChips, setLocalChips] = useState(meta.totalChips)

  const allocatedCount = Object.values(localMods).reduce((sum, value) => sum + value, 0)
  const textLocale = lang === 'ru' ? 'ru-RU' : 'en-US'

  function menuCaps(value: string) {
    return value.toLocaleUpperCase(textLocale)
  }

  function allocate(id: ModifierId, cost: number, max: number) {
    const current = localMods[id] ?? 0
    if (current >= max || localChips < cost) return
    playButtonSFX()
    setLocalMods((prev) => ({ ...prev, [id]: current + 1 }))
    setLocalChips((prev) => prev - cost)
  }

  function refund(id: ModifierId, cost: number) {
    const current = localMods[id] ?? 0
    if (current <= 0) return
    playButtonSFX()
    setLocalMods((prev) => ({ ...prev, [id]: current - 1 }))
    setLocalChips((prev) => prev + cost)
  }

  function refundAll() {
    playButtonSFX()
    setLocalMods(Object.fromEntries(MODIFIERS.map((m) => [m.id, 0])))
    setLocalChips(meta.totalChips)
  }

  function handleSaveAndExit() {
    primeAudioPlayback()
    const allocated = MODIFIERS
      .filter((m) => (localMods[m.id] ?? 0) > 0)
      .map((m) => ({ modifierId: m.id, count: localMods[m.id] }))

    store.applyMetaAllocation(allocated, localChips)
    setPhase('meta_menu') // returns to StartScreen
  }

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => {
            playButtonSFX()
            handleSaveAndExit()
          }}
        >
          {t('back')}
        </button>

        <div className={styles.headerCopy}>
          <h2 className={styles.title}>{menuCaps(t('modifiers_title'))}</h2>
          <div className={styles.summaryRow}>
            <span className={styles.summaryChip}>
              {localChips} {t('chips')}
            </span>
            <span className={styles.summaryChip}>x{allocatedCount}</span>
          </div>
        </div>
      </div>

      <div className={styles.list}>
        {MODIFIERS.map((mod) => {
          const count = localMods[mod.id] ?? 0
          const canBuy = localChips >= mod.chipsCost && count < mod.max
          return (
            <div key={mod.id} className={styles.modCard}>
              <span className={styles.modIcon}>{mod.icon}</span>

              <div className={styles.modInfo}>
                <span className={styles.modName}>{menuCaps(t(mod.nameKey))}</span>
                <span className={styles.modDesc}>{t(mod.descKey)}</span>
                <div className={styles.modFooter}>
                  <span className={styles.modCost}>
                    {mod.chipsCost} · {t('max_label')} {mod.max}
                  </span>
                  <div className={styles.rankDots}>
                    {Array.from({ length: mod.max }, (_, index) => (
                      <span
                        key={`${mod.id}-${index}`}
                        className={styles.rankDot}
                        data-active={index < count ? 'true' : 'false'}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modControls}>
                <button
                  className={styles.ctrlBtn}
                  onClick={() => refund(mod.id, mod.chipsCost)}
                  disabled={count <= 0}
                >
                  -
                </button>
                <span className={styles.ctrlCount}>{count}</span>
                <button
                  className={styles.ctrlBtn}
                  onClick={() => allocate(mod.id, mod.chipsCost, mod.max)}
                  disabled={!canBuy}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.refundBtn}
          onClick={refundAll}
          disabled={allocatedCount === 0}
        >
          {t('reset_all')}
        </button>
        <button className={styles.startBtn} onClick={handleSaveAndExit}>
          {t('back_to_menu')}
        </button>
      </div>
    </motion.div>
  )
}
