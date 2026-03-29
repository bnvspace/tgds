import { useState } from 'react'
import { motion } from 'framer-motion'
import { ALL_SYMBOLS } from '@/game/symbols'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import type { GameSymbol } from '@/types'
import styles from './InitialShop.module.css'

const SYMBOL_COST: Record<string, number> = {
  common: 5,
  rare: 10,
  epic: 15,
}

export default function InitialShopScreen() {
  const setPhase = useGameStore((state) => state.setPhase)
  const player = useGameStore((state) => state.player)
  const setPlayer = useGameStore((state) => state.setPlayer)
  const meta = useGameStore((state) => state.meta)
  const setReelsFromSelection = useGameStore((state) => state.setReelsFromSelection)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { t, localizeSymbolName } = useTranslation()

  const available = ALL_SYMBOLS.filter((symbol) => meta.unlockedSymbolIds.includes(symbol.id))
  const currentCost = Array.from(selected).reduce((sum, id) => {
    const symbol = available.find((entry) => entry.id === id)
    return sum + (symbol ? SYMBOL_COST[symbol.rarity] : 0)
  }, 0)
  const remainingTokens = (player?.tokens ?? 0) - currentCost

  function effectDescription(symbol: GameSymbol) {
    const { effect } = symbol
    const parts = []

    if (effect.damage) parts.push(`⚔ ${effect.damage * symbol.level} ${t('dmg')}`)
    if (effect.magicDamage) parts.push(`✨ ${effect.magicDamage * symbol.level} ${t('magic')}`)
    if (effect.armor) parts.push(`🛡 +${effect.armor * symbol.level} ${t('armor')}`)
    if (effect.tokens) parts.push(`🪙 +${effect.tokens * symbol.level} ${t('tokens')}`)
    if (effect.heal) parts.push(`❤ +${effect.heal * symbol.level} ${t('heal')}`)

    return parts.join('  ') || t('no_effect')
  }

  function toggle(symbol: GameSymbol) {
    setSelected((previous) => {
      const next = new Set(previous)

      if (next.has(symbol.id)) {
        next.delete(symbol.id)
      } else if (remainingTokens >= SYMBOL_COST[symbol.rarity]) {
        next.add(symbol.id)
      }

      return next
    })
  }

  function confirm() {
    if (!player) {
      return
    }

    const chosenSymbols = available.filter((symbol) => selected.has(symbol.id))
    if (chosenSymbols.length === 0) {
      return
    }

    setReelsFromSelection(chosenSymbols)
    setPlayer({ ...player, tokens: remainingTokens })
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
      <div className={styles.balanceBadge}>
        🪙 {remainingTokens} {t('tokens')}
      </div>

      <div className={styles.grid}>
        {available.map((symbol) => {
          const isSelected = selected.has(symbol.id)
          const cost = SYMBOL_COST[symbol.rarity]

          return (
            <button
              key={symbol.id}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${!isSelected && remainingTokens < cost ? styles.cardDisabled : ''}`}
              onClick={() => toggle(symbol)}
            >
              <span className={styles.icon}>{symbol.icon}</span>
              <span className={styles.name}>{localizeSymbolName(symbol)}</span>
              <span className={styles.type}>{effectDescription(symbol)}</span>
              <span className={styles.costBadge}>🪙 {cost}</span>
            </button>
          )
        })}
      </div>

      <button className={styles.confirmBtn} onClick={confirm} disabled={selected.size === 0}>
        ▶ {t('confirm')} ({selected.size})
      </button>
    </motion.div>
  )
}
