import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import type { ModifierId } from '@/types'
import styles from './MetaMenu.module.css'

const MODIFIERS: Array<{
  id: ModifierId
  name: string
  icon: string
  description: string
  chipsCost: number
  max: number
}> = [
  {
    id: 'health_core',
    name: 'Health Core',
    icon: '❤️',
    description: '+20 max HP per rank',
    chipsCost: 25,
    max: 5,
  },
  {
    id: 'physical_strength',
    name: 'Strength',
    icon: '⚔️',
    description: '+20% physical dmg per rank',
    chipsCost: 50,
    max: 3,
  },
  {
    id: 'reel_slot',
    name: 'Reel Slot',
    icon: '🎰',
    description: '+1 reel (max 5)',
    chipsCost: 100,
    max: 2,
  },
  {
    id: 'token_collector',
    name: 'Token Collector',
    icon: '🪙',
    description: '+2 tokens per Coin symbol roll',
    chipsCost: 40,
    max: 3,
  },
]

export default function MetaMenu() {
  const meta = useGameStore((s) => s.meta)
  const startRun = useGameStore((s) => s.startRun)
  const store = useGameStore()
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
      <div className={styles.header}>
        <h2 className={styles.title}>Modifiers</h2>
        <span className={styles.chips}>
          🔵 {localChips} chips
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
                <span className={styles.modName}>{mod.name}</span>
                <span className={styles.modDesc}>{mod.description}</span>
                <span className={styles.modCost}>🔵 {mod.chipsCost} · max {mod.max}</span>
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
          ↩ Reset All
        </button>
        <button className={styles.startBtn} onClick={handleStart}>
          ▶ START RUN
        </button>
      </div>
    </motion.div>
  )
}
