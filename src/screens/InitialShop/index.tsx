import { useState } from 'react'
import { motion } from 'framer-motion'
import { ALL_SYMBOLS } from '@/game/symbols'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import type { GameSymbol } from '@/types'
import styles from './InitialShop.module.css'

const RARITY_COLOR: Record<string, string> = {
  common: '#888',
  rare: '#4a90d9',
  epic: '#9b72cf',
}

export default function InitialShopScreen() {
  const setPhase = useGameStore((s) => s.setPhase)
  const meta = useGameStore((s) => s.meta)
  const setReelsFromSelection = useGameStore((s) => s.setReelsFromSelection)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { t } = useTranslation()

  const EFFECT_DESC = (sym: GameSymbol) => {
    const e = sym.effect
    const parts = []
    if (e.damage) parts.push(`⚔ ${e.damage * sym.level} ${t('dmg')}`)
    if (e.magicDamage) parts.push(`✨ ${e.magicDamage * sym.level} ${t('magic')}`)
    if (e.armor) parts.push(`🛡 +${e.armor * sym.level} ${t('armor')}`)
    if (e.tokens) parts.push(`🪙 +${e.tokens * sym.level} ${t('tokens')}`)
    if (e.heal) parts.push(`❤ +${e.heal * sym.level} ${t('heal')}`)
    return parts.join('  ') || '—'
  }

  const available = ALL_SYMBOLS.filter((s) => meta.unlockedSymbolIds.includes(s.id))

  function toggle(sym: GameSymbol) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(sym.id)) {
        next.delete(sym.id)
      } else {
        next.add(sym.id)
      }
      return next
    })
  }

  function confirm() {
    const chosenSymbols = available.filter((s) => selected.has(s.id))
    if (chosenSymbols.length === 0) return
    setReelsFromSelection(chosenSymbols)
    setPhase('world_map')
  }

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h2 className={styles.title}>{t('choose_symbols')}</h2>
      <p className={styles.subtitle}>{t('selected_desc')}</p>

      <div className={styles.grid}>
        {available.map((sym) => {
          const isSelected = selected.has(sym.id)
          return (
            <button
              key={sym.id}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
              style={{ borderColor: isSelected ? '#c8a96e' : RARITY_COLOR[sym.rarity] }}
              onClick={() => toggle(sym)}
            >
              <span className={styles.icon}>{sym.icon}</span>
              <span className={styles.name}>{sym.name}</span>
              <span className={styles.type}>{EFFECT_DESC(sym)}</span>
            </button>
          )
        })}
      </div>

      <button
        className={styles.confirmBtn}
        onClick={confirm}
        disabled={selected.size === 0}
      >
        ▶ {t('confirm')} ({selected.size})
      </button>
    </motion.div>
  )
}
