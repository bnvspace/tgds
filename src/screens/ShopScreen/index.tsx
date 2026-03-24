import { useState } from 'react'
import { motion } from 'framer-motion'
import { ALL_SYMBOLS } from '@/game/symbols'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import type { GameSymbol } from '@/types'
import styles from './ShopScreen.module.css'

const RARITY_COLOR: Record<string, string> = {
  common: '#888',
  rare: '#4a90d9',
  epic: '#9b72cf',
}

const SYMBOL_COST: Record<string, number> = {
  common: 10,
  rare: 20,
  epic: 35,
}

export default function ShopScreen() {
  const player = useGameStore((s) => s.player)
  const meta = useGameStore((s) => s.meta)
  const addSymbolToReel = useGameStore((s) => s.addSymbolToReel)
  const removeSymbolFromReel = useGameStore((s) => s.removeSymbolFromReel)
  const setPlayer = useGameStore((s) => s.setPlayer)
  const setPhase = useGameStore((s) => s.setPhase)
  const { t } = useTranslation()

  const EFFECT_DESC = (sym: GameSymbol) => {
    const e = sym.effect
    const parts = []
    if (e.damage) parts.push(`⚔ ${e.damage * sym.level} ${t('dmg')}`)
    if (e.magicDamage) parts.push(`✨ ${e.magicDamage * sym.level} ${t('magic')}`)
    if (e.armor) parts.push(`🛡 +${e.armor * sym.level} ${t('armor')}`)
    if (e.tokens) parts.push(`🪙 +${e.tokens * sym.level} ${t('tokens')}`)
    if (e.heal) parts.push(`❤ +${e.heal * sym.level} ${t('heal')}`)
    return parts.join(' ') || '—'
  }

  const [tab, setTab] = useState<'buy' | 'remove'>('buy')
  const [boughtIds, setBoughtIds] = useState<Set<string>>(new Set())

  // Unlocked symbols available in shop (pick 4 random from unlocked pool)
  const shopSymbols = ALL_SYMBOLS
    .filter((s) => meta.unlockedSymbolIds.includes(s.id))
    .slice(0, 4)

  function buySymbol(sym: GameSymbol) {
    if (!player) return
    const cost = SYMBOL_COST[sym.rarity]
    if (player.tokens < cost) return
    if (boughtIds.has(sym.id)) return

    // Add to reel with fewest symbols (deck-thinning logic reversed: add to least-loaded)
    const minReelIdx = player.reels.reduce((minIdx, r, i, arr) =>
      r.symbolPool.length < arr[minIdx].symbolPool.length ? i : minIdx, 0)

    addSymbolToReel(sym, minReelIdx)
    setPlayer({ ...player, tokens: player.tokens - cost })
    setBoughtIds((prev) => new Set(prev).add(sym.id))
  }

  function removeSymbol(symbolId: string, reelIndex: number) {
    const reel = player?.reels[reelIndex]
    if (!reel || reel.symbolPool.length <= 1) return // keep at least 1 symbol per reel
    removeSymbolFromReel(symbolId, reelIndex)
  }

  function heal() {
    if (!player || player.tokens < 15) return
    setPlayer({
      ...player,
      hp: Math.min(player.maxHp, player.hp + 25),
      tokens: player.tokens - 15,
    })
  }

  function proceed() {
    setPhase('world_map')
  }

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>🏪 {t('shop_title')}</h2>
        <span className={styles.tokens}>🪙 {player?.tokens ?? 0}</span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'buy' ? styles.tabActive : ''}`}
          onClick={() => setTab('buy')}
        >
          {t('buy_tab')}
        </button>
        <button
          className={`${styles.tab} ${tab === 'remove' ? styles.tabActive : ''}`}
          onClick={() => setTab('remove')}
        >
          {t('remove_tab')}
        </button>
      </div>

      {tab === 'buy' && (
        <div className={styles.shopGrid}>
          {/* Heal node */}
          <button
            className={`${styles.shopCard} ${styles.healCard}`}
            onClick={heal}
            disabled={!player || player.tokens < 15}
          >
            <span className={styles.shopIcon}>❤️</span>
            <span className={styles.shopName}>{t('shop_heal')}</span>
            <span className={styles.shopEffect}>+25 HP</span>
            <span className={styles.shopCost}>🪙 15</span>
          </button>

          {/* Symbol slots */}
          {shopSymbols.map((sym) => {
            const cost = SYMBOL_COST[sym.rarity]
            const canAfford = (player?.tokens ?? 0) >= cost
            const bought = boughtIds.has(sym.id)
            return (
              <button
                key={sym.id}
                className={`${styles.shopCard} ${bought ? styles.bought : ''}`}
                style={{ borderColor: RARITY_COLOR[sym.rarity] }}
                onClick={() => buySymbol(sym)}
                disabled={!canAfford || bought}
              >
                <span className={styles.shopIcon}>{sym.icon}</span>
                <span className={styles.shopName}>{sym.name}</span>
                <span className={styles.shopEffect}>{EFFECT_DESC(sym)}</span>
                <span className={styles.shopCost}>
                  {bought ? `✓ ${t('added')}` : `🪙 ${cost}`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {tab === 'remove' && (
        <div className={styles.removeSection}>
          <p className={styles.removeHint}>{t('remove_hint')}</p>
          {player?.reels.map((reel, ri) => (
            <div key={ri} className={styles.reelGroup}>
              <span className={styles.reelLabel}>{t('reel')} {ri + 1}</span>
              <div className={styles.reelSymbols}>
                {reel.symbolPool.map((ws, si) => (
                  <button
                    key={`${ws.symbol.id}-${si}`}
                    className={styles.removeBtn}
                    onClick={() => removeSymbol(ws.symbol.id, ri)}
                    disabled={reel.symbolPool.length <= 1}
                    title={`${t('remove_symbol')} ${ws.symbol.name}`}
                  >
                    {ws.symbol.icon}
                    <span className={styles.removeX}>✕</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className={styles.proceedBtn} onClick={proceed}>
        ▶ {t('continue')}
      </button>
    </motion.div>
  )
}
