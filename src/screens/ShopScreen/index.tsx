import { useState } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { shopBackdrop, symbolIconById } from '@/assets/pixelArt'
import GameIcon from '@/components/GameIcon'
import { CONFIG } from '@/constants'
import { ALL_SYMBOLS } from '@/game/symbols'
import { useTranslation } from '@/i18n'
import { useGameStore } from '@/store/gameStore'
import type { GameSymbol } from '@/types'
import { playButtonSFX, playCoinSFX } from '@/utils/audio'
import { haptics } from '@/utils/haptics'
import styles from './ShopScreen.module.css'

const TOKEN_CAP = 100
const HEAL_PRICE = 15
const SHOP_DISCOUNT_PER_RANK = 0.1

const SYMBOL_COST: Record<string, number> = {
  common: 10,
  rare: 20,
  epic: 35,
}

function getDiscountedPrice(basePrice: number, discountRanks: number) {
  const multiplier = Math.max(0.5, 1 - discountRanks * SHOP_DISCOUNT_PER_RANK)
  return Math.max(1, Math.round(basePrice * multiplier))
}

/** Deterministic Fisher-Yates shuffle seeded by an integer */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  let s = seed

  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

export default function ShopScreen() {
  const player = useGameStore((state) => state.player)
  const meta = useGameStore((state) => state.meta)
  const addSymbolToInventory = useGameStore((state) => state.addSymbolToInventory)
  const removeSymbolFromInventory = useGameStore((state) => state.removeSymbolFromInventory)
  const setPlayer = useGameStore((state) => state.setPlayer)
  const setPhase = useGameStore((state) => state.setPhase)
  const { t, localizeSymbolName } = useTranslation()

  const [tab, setTab] = useState<'buy' | 'remove'>('buy')
  const [boughtIds, setBoughtIds] = useState<Set<string>>(new Set())

  // Rotate shop symbols based on fightsWon — new fight = new selection
  const shopSymbols = seededShuffle(
    ALL_SYMBOLS.filter((symbol) => meta.unlockedSymbolIds.includes(symbol.id)),
    (player?.fightsWon ?? 0) * 7919,
  ).slice(0, 3)

  const activeSymbolsCount = player?.symbolInventory.length ?? 0
  const reelCount = player?.reels.length ?? 0
  const tokens = player?.tokens ?? 0
  const shopDiscountRanks = player?.metaModifiers
    .filter((modifier) => modifier.id === 'shop_discount')
    .length ?? 0
  const tokenFillPct = Math.min(100, (tokens / TOKEN_CAP) * 100)
  const tokenCapReached = tokens >= TOKEN_CAP

  function effectDescription(symbol: GameSymbol) {
    const { effect } = symbol
    const parts: string[] = []

    if (effect.damage) parts.push(`DMG ${effect.damage * symbol.level}`)
    if (effect.magicDamage) parts.push(`✨ ${effect.magicDamage * symbol.level}`)
    if (effect.armor) parts.push(`+${effect.armor * symbol.level} ${t('armor')}`)
    if (effect.tokens) parts.push(`+${effect.tokens * symbol.level} ${t('tokens')}`)
    if (effect.heal) parts.push(`+${effect.heal * symbol.level} ${t('heal')}`)
    if (effect.poisonStacks) parts.push(`☠ +${effect.poisonStacks * symbol.level}/${t('turn')}`)
    if (effect.stunTurns) parts.push(`⚡ ${t('status_stunned')}`)

    return parts.join(' ') || t('no_effect')
  }

  function buySymbol(symbol: GameSymbol) {
    if (!player) return

    const cost = getDiscountedPrice(SYMBOL_COST[symbol.rarity], shopDiscountRanks)
    if (player.tokens < cost || boughtIds.has(symbol.id)) return

    addSymbolToInventory(symbol)
    setPlayer({ ...player, tokens: player.tokens - cost })
    setBoughtIds((previous) => new Set(previous).add(symbol.id))
    playCoinSFX()
    haptics.coinPickup()
  }

  function removeSymbol(index: number) {
    if (!player || player.symbolInventory.length <= CONFIG.START_SYMBOL_COUNT) return
    removeSymbolFromInventory(index)
  }

  function heal() {
    const healCost = getDiscountedPrice(HEAL_PRICE, shopDiscountRanks)

    if (!player || player.tokens < healCost || player.hp >= player.maxHp) return

    playButtonSFX()
    haptics.heal()
    setPlayer({
      ...player,
      hp: Math.min(player.maxHp, player.hp + 25),
      tokens: player.tokens - healCost,
    })
  }

  function proceed() {
    playButtonSFX()
    setPhase('world_map')
  }

  const screenStyle = {
    '--shop-backdrop': `url("${shopBackdrop}")`,
  } as CSSProperties
  const healCost = getDiscountedPrice(HEAL_PRICE, shopDiscountRanks)

  return (
    <motion.div
      className={styles.screen}
      style={screenStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <h2 className={styles.title}>{t('shop_title')}</h2>
          <p className={styles.subtitle}>
            {t('active_symbols')}: {activeSymbolsCount}
          </p>
        </div>

        <div className={styles.headerStats}>
          {/* Coin cap indicator */}
          <div className={styles.tokenCap} data-capped={tokenCapReached ? 'true' : 'false'}>
            <span className={styles.tokenCapLabel}>
              🪙 {tokens}<span className={styles.tokenCapMax}>/{TOKEN_CAP}</span>
            </span>
            <div className={styles.tokenBar}>
              <div className={styles.tokenFill} style={{ width: `${tokenFillPct}%` }} />
            </div>
          </div>
          <span className={styles.statChip}>{t('hp_label')} {player?.hp ?? 0}/{player?.maxHp ?? 0}</span>
          <span className={styles.statChip}>{t('reel')} {reelCount}</span>
        </div>
      </div>

      <div className={styles.activeSection}>
        <div className={styles.reelStrip}>
          <span className={styles.reelStripLabel}>{t('active_symbols')}</span>

          <div className={styles.activeSymbols}>
            {player?.symbolInventory.map((weightedSymbol, index) => (
              <div
                key={`${weightedSymbol.symbol.id}-${index}`}
                className={styles.activeSymbolSlot}
                title={localizeSymbolName(weightedSymbol.symbol)}
              >
                <GameIcon
                  icon={weightedSymbol.symbol.icon}
                  alt={localizeSymbolName(weightedSymbol.symbol)}
                  className={styles.activeSymbolIcon}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'buy' ? styles.tabActive : ''}`}
          onClick={() => { setTab('buy'); playButtonSFX(); haptics.selectionChange() }}
        >
          {t('buy_tab')}
        </button>
        <button
          className={`${styles.tab} ${tab === 'remove' ? styles.tabActive : ''}`}
          onClick={() => { setTab('remove'); playButtonSFX(); haptics.selectionChange() }}
        >
          {t('remove_tab')}
        </button>
      </div>

      {tab === 'buy' && (
        <div className={styles.shopGrid}>
          <button
            className={`${styles.shopCard} ${styles.healCard}`}
            onClick={heal}
            disabled={!player || player.tokens < healCost || player.hp >= player.maxHp}
          >
            <div className={styles.shopIconFrame}>
              <GameIcon
                icon={symbolIconById.health_potion}
                alt={t('shop_heal')}
                className={styles.shopIcon}
              />
            </div>
            <div className={styles.shopCardBody}>
              <div className={styles.shopMeta}>
                <span className={styles.rarityBadge} data-rarity="common">
                  {t('rarity_common')}
                </span>
                <span className={styles.typeBadge}>{t('heal')}</span>
              </div>
              <span className={styles.shopName}>{t('shop_heal')}</span>
              <span className={styles.shopEffect}>+25 {t('hp_label')}</span>
            </div>
            <span className={styles.shopCost}>{healCost}</span>
          </button>

          {shopSymbols.map((symbol) => {
            const cost = getDiscountedPrice(SYMBOL_COST[symbol.rarity], shopDiscountRanks)
            const canAfford = tokens >= cost
            const bought = boughtIds.has(symbol.id)

            return (
              <button
                key={symbol.id}
                className={`${styles.shopCard} ${bought ? styles.bought : ''}`}
                data-rarity={symbol.rarity}
                onClick={() => buySymbol(symbol)}
                disabled={!canAfford || bought}
              >
                <div className={styles.shopIconFrame}>
                  <GameIcon
                    icon={symbol.icon}
                    alt={localizeSymbolName(symbol)}
                    className={styles.shopIcon}
                  />
                </div>
                <div className={styles.shopCardBody}>
                  <div className={styles.shopMeta}>
                    <span className={styles.rarityBadge} data-rarity={symbol.rarity}>
                      {t(`rarity_${symbol.rarity}`)}
                    </span>
                    <span className={styles.typeBadge}>
                      {t(`symbol_type_${symbol.type}`)}
                    </span>
                  </div>
                  <span className={styles.shopName}>{localizeSymbolName(symbol)}</span>
                  <span className={styles.shopEffect}>{effectDescription(symbol)}</span>
                </div>
                <span className={styles.shopCost}>
                  {bought ? t('added') : cost}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {tab === 'remove' && (
        <div className={styles.removeSection}>
          <p className={styles.removeHint}>{t('remove_hint')}</p>
          <div className={styles.reelGroup}>
            <span className={styles.reelLabel}>{t('active_symbols')}</span>
            <div className={styles.reelSymbols}>
              {player?.symbolInventory.map((weightedSymbol, index) => (
                <button
                  key={`${weightedSymbol.symbol.id}-${index}`}
                  className={styles.removeBtn}
                  onClick={() => removeSymbol(index)}
                  disabled={(player?.symbolInventory.length ?? 0) <= CONFIG.START_SYMBOL_COUNT}
                  title={`${t('remove_symbol')} ${localizeSymbolName(weightedSymbol.symbol)}`}
                >
                  <GameIcon
                    icon={weightedSymbol.symbol.icon}
                    alt={localizeSymbolName(weightedSymbol.symbol)}
                    className={styles.removeIcon}
                  />
                  <span className={styles.removeX}>x</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button className={styles.proceedBtn} onClick={proceed}>
        {'>'} {t('continue')}
      </button>
    </motion.div>
  )
}
