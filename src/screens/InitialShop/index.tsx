import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import GameIcon from '@/components/GameIcon'
import { ALL_SYMBOLS, BASE_STARTER_SYMBOL_IDS } from '@/game/symbols'
import { CONFIG } from '@/constants'
import { useTranslation } from '@/i18n'
import { useGameStore } from '@/store/gameStore'
import type { GameSymbol } from '@/types'
import styles from './InitialShop.module.css'

export default function StartSymbolsScreen() {
  const setPhase = useGameStore((state) => state.setPhase)
  const meta = useGameStore((state) => state.meta)
  const setReelsFromSelection = useGameStore((state) => state.setReelsFromSelection)
  const starterIds = meta.unlockedStarterSymbolIds.length > 0
    ? meta.unlockedStarterSymbolIds
    : [...BASE_STARTER_SYMBOL_IDS]
  const available = ALL_SYMBOLS.filter((symbol) => starterIds.includes(symbol.id))
  const availableIds = available.map((symbol) => symbol.id)
  const availableIdsKey = availableIds.join('|')
  const starterSetLocked = available.length <= CONFIG.START_SYMBOL_COUNT
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(starterSetLocked ? available.map((symbol) => symbol.id) : []),
  )
  const { t, localizeSymbolName } = useTranslation()

  useEffect(() => {
    const availableIdSet = new Set(availableIds)

    setSelected((previous) => {
      if (starterSetLocked) {
        const next = new Set(availableIds)
        const isSameSize = previous.size === next.size
        const hasSameEntries = isSameSize && Array.from(previous).every((id) => next.has(id))
        return hasSameEntries ? previous : next
      }

      const next = new Set<string>()
      for (const id of previous) {
        if (availableIdSet.has(id) && next.size < CONFIG.START_SYMBOL_COUNT) {
          next.add(id)
        }
      }
      const isSameSize = previous.size === next.size
      const hasSameEntries = isSameSize && Array.from(previous).every((id) => next.has(id))
      return hasSameEntries ? previous : next
    })
  }, [availableIdsKey, starterSetLocked])

  function effectDescription(symbol: GameSymbol) {
    const { effect } = symbol
    const parts = []

    if (effect.damage) parts.push(`⚔ ${effect.damage * symbol.level} ${t('dmg')}`)
    if (effect.magicDamage) parts.push(`✦ ${effect.magicDamage * symbol.level} ${t('magic')}`)
    if (effect.armor) parts.push(`🛡 +${effect.armor * symbol.level} ${t('armor')}`)
    if (effect.tokens) parts.push(`🪙 +${effect.tokens * symbol.level} ${t('tokens')}`)
    if (effect.heal) parts.push(`❤ +${effect.heal * symbol.level} ${t('heal')}`)

    return parts.join('  ') || t('no_effect')
  }

  function toggle(symbol: GameSymbol) {
    if (starterSetLocked) {
      return
    }

    setSelected((previous) => {
      const next = new Set(previous)

      if (next.has(symbol.id)) {
        next.delete(symbol.id)
      } else if (next.size < CONFIG.START_SYMBOL_COUNT) {
        next.add(symbol.id)
      }

      return next
    })
  }

  function confirm() {
    const chosenSymbols = available.filter((symbol) => selected.has(symbol.id))
    if (chosenSymbols.length !== CONFIG.START_SYMBOL_COUNT) {
      return
    }

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
      <div className={styles.balanceBadge}>
        {selected.size}/{CONFIG.START_SYMBOL_COUNT}
      </div>

      <div className={styles.grid}>
        {available.map((symbol) => {
          const isSelected = selected.has(symbol.id)
          const canSelectMore = selected.size < CONFIG.START_SYMBOL_COUNT
          const isDisabled = !isSelected && !starterSetLocked && !canSelectMore

          return (
            <button
              key={symbol.id}
              type="button"
              className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${isDisabled ? styles.cardDisabled : ''}`}
              onClick={() => toggle(symbol)}
            >
              <GameIcon
                icon={symbol.icon}
                alt={localizeSymbolName(symbol)}
                className={styles.icon}
              />
              <span className={styles.name}>{localizeSymbolName(symbol)}</span>
              <span className={styles.type}>{effectDescription(symbol)}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className={styles.confirmBtn}
        onClick={confirm}
        disabled={selected.size !== CONFIG.START_SYMBOL_COUNT}
      >
        {'>'} {t('confirm')} ({selected.size})
      </button>
    </motion.div>
  )
}
