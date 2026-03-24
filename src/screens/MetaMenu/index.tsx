import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import type { ModifierId } from '@/types'
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
    icon: '❤️',
    descKey: 'mod_health_desc',
    chipsCost: 25,
    max: 5,
  },
  {
    id: 'physical_strength',
    nameKey: 'mod_str_name',
    icon: '⚔️',
    descKey: 'mod_str_desc',
    chipsCost: 50,
    max: 3,
  },
  {
    id: 'reel_slot',
    nameKey: 'mod_reel_name',
    icon: '🎰',
    descKey: 'mod_reel_desc',
    chipsCost: 100,
    max: 2,
  },
  {
    id: 'token_collector',
    nameKey: 'mod_token_name',
    icon: '🪙',
    descKey: 'mod_token_desc',
    chipsCost: 40,
    max: 3,
  },
]

export default function MetaMenu() {
  const meta = useGameStore((s) => s.meta)
  const startRun = useGameStore((s) => s.startRun)
  const setLanguage = useGameStore((s) => s.setLanguage)
  const store = useGameStore()
  const { t, lang } = useTranslation()

  const [localMods, setLocalMods] = useState(() =>
    Object.fromEntries(MODIFIERS.map((m) => [
      m.id,
      meta.allocatedModifiers.find((a) => a.modifierId === m.id)?.count ?? 0,
    ]))
  )
  const [localChips, setLocalChips] = useState(meta.totalChips)

  function allocate(id: ModifierId, cost: number, max: number) {
    const current = localMods[id] ?? 0
    if (current >= max || localChips < cost) return
    setLocalMods((prev) => ({ ...prev, [id]: current + 1 }))
    setLocalChips((prev) => prev - cost)
  }

  function refund(id: ModifierId, cost: number) {
    const current = localMods[id] ?? 0
    if (current <= 0) return
    setLocalMods((prev) => ({ ...prev, [id]: current - 1 }))
    setLocalChips((prev) => prev + cost)
  }

  function refundAll() {
    setLocalMods(Object.fromEntries(MODIFIERS.map((m) => [m.id, 0])))
    setLocalChips(meta.totalChips)
  }

  function handleStart() {
    // Apply local allocation to meta before starting
    const allocated = MODIFIERS
      .filter((m) => (localMods[m.id] ?? 0) > 0)
      .map((m) => ({ modifierId: m.id, count: localMods[m.id] }))

    store.applyMetaAllocation(allocated, localChips)
    startRun()
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
        onClick={() => setLanguage(lang === 'ru' ? 'en' : 'ru')}
        style={{ position: 'absolute', top: 16, left: 16, background: '#12121e', color: '#c8a96e', border: '2px solid #3d2b1f', padding: '8px', cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
      >
        {lang === 'ru' ? '🇷🇺' : '🇬🇧'}
      </button>

      <div className={styles.header}>
        <h2 className={styles.title}>{t('modifiers_title')}</h2>
        <span className={styles.chips}>
          🔵 {localChips} {t('chips')}
        </span>
      </div>

      <div className={styles.list}>
        {MODIFIERS.map((mod) => {
          const count = localMods[mod.id] ?? 0
          const canBuy = localChips >= mod.chipsCost && count < mod.max
          return (
            <div key={mod.id} className={styles.modCard}>
              <span className={styles.modIcon}>{mod.icon}</span>
              <div className={styles.modInfo}>
                <span className={styles.modName}>{t(mod.nameKey)}</span>
                <span className={styles.modDesc}>{t(mod.descKey)}</span>
                <span className={styles.modCost}>🔵 {mod.chipsCost} · {t('max_label')} {mod.max}</span>
              </div>
              <div className={styles.modControls}>
                <button
                  className={styles.ctrlBtn}
                  onClick={() => refund(mod.id, mod.chipsCost)}
                  disabled={count <= 0}
                >
                  −
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
        <button className={styles.refundBtn} onClick={refundAll}>
          ↩ {t('reset_all')}
        </button>
        <button className={styles.startBtn} onClick={handleStart}>
          ▶ {t('start_run')}
        </button>
      </div>
    </motion.div>
  )
}
