import { useState } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { shopBackdrop, symbolIconById } from '@/assets/pixelArt'
import GameIcon from '@/components/GameIcon'
import { ALL_SYMBOLS } from '@/game/symbols'
import { useTranslation } from '@/i18n'
import { useGameStore } from '@/store/gameStore'
import type { GameSymbol } from '@/types'
import { playButtonSFX, playCoinSFX } from '@/utils/audio'
import { haptics } from '@/utils/haptics'
import styles from './ShopScreen.module.css'

const SYMBOL_COST: Record<string, number> = {
  common: 10,
  rare: 20,
  epic: 35,
}

export default function ShopScreen() {
  const player = useGameStore((state) => state.player)
  const meta = useGameStore((state) => state.meta)
  const addSymbolToReel = useGameStore((state) => state.addSymbolToReel)
  const removeSymbolFromReel = useGameStore((state) => state.removeSymbolFromReel)
  const setPlayer = useGameStore((state) => state.setPlayer)
  const setPhase = useGameStore((state) => state.setPhase)
  const { t, localizeSymbolName } = useTranslation()

  const [tab, setTab] = useState<'buy' | 'remove'>('buy')
  const [boughtIds, setBoughtIds] = useState<Set<string>>(new Set())

  const shopSymbols = ALL_SYMBOLS
    .filter((symbol) => meta.unlockedSymbolIds.includes(symbol.id))
    .slice(0, 4)

  const activeSymbolsCount = player?.reels.reduce((sum, reel) => sum + reel.symbolPool.length, 0) ?? 0
  const reelCount = player?.reels.length ?? 0

  function effectDescription(symbol: GameSymbol) {
    const { effect } = symbol
    const parts = []

    if (effect.damage) parts.push(`⚔ ${effect.damage * symbol.level} ${t('dmg')}`)
    if (effect.magicDamage) parts.push(`✦ ${effect.magicDamage * symbol.level} ${t('magic')}`)
    if (effect.armor) parts.push(`🛡 +${effect.armor * symbol.level} ${t('armor')}`)
    if (effect.tokens) parts.push(`🪙 +${effect.tokens * symbol.level} ${t('tokens')}`)
    if (effect.heal) parts.push(`❤ +${effect.heal * symbol.level} ${t('heal')}`)

    return parts.join(' ') || t('no_effect')
  }

  function buySymbol(symbol: GameSymbol) {
    if (!player) {
      return
    }

    const cost = SYMBOL_COST[symbol.rarity]
    if (player.tokens < cost || boughtIds.has(symbol.id)) {
      return
    }

    const targetReelIndex = player.reels.reduce((minIndex, reel, index, reels) => (
      reel.symbolPool.length < reels[minIndex].symbolPool.length ? index : minIndex
    ), 0)

    addSymbolToReel(symbol, targetReelIndex)
    setPlayer({ ...player, tokens: player.tokens - cost })
    setBoughtIds((previous) => new Set(previous).add(symbol.id))
    playCoinSFX()
    haptics.coinPickup()
  }

  function removeSymbol(symbolId: string, reelIndex: number) {
    const reel = player?.reels[reelIndex]
    if (!reel || reel.symbolPool.length <= 1) {
      return
    }

    removeSymbolFromReel(symbolId, reelIndex)
  }

  function heal() {
    if (!player || player.tokens < 15 || player.hp >= player.maxHp) {
      return
    }

    playButtonSFX()
    haptics.heal()
    setPlayer({
      ...player,
      hp: Math.min(player.maxHp, player.hp + 25),
      tokens: player.tokens - 15,
    })
  }

  function proceed() {
    playButtonSFX()
    setPhase('world_map')
  }

  const screenStyle = {
    '--shop-backdrop': `url("${shopBackdrop}")`,
  } as CSSProperties

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
          <span className={styles.statChip}>{t('tokens_short')} {player?.tokens ?? 0}</span>
          <span className={styles.statChip}>{t('hp_label')} {player?.hp ?? 0}/{player?.maxHp ?? 0}</span>
          <span className={styles.statChip}>{t('reel')} {reelCount}</span>
        </div>
      </div>

      <div className={styles.activeSection}>
        {player?.reels.map((reel, reelIndex) => (
          <div key={reel.id} className={styles.reelStrip}>
            <span className={styles.reelStripLabel}>
              {t('reel')} {reelIndex + 1}
            </span>

            <div className={styles.activeSymbols}>
              {reel.symbolPool.map((weightedSymbol, index) => (
                <div
                  key={`${reel.id}-${weightedSymbol.symbol.id}-${index}`}
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
        ))}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'buy' ? styles.tabActive : ''}`}
          onClick={() => {
            setTab('buy')
            playButtonSFX()
            haptics.selectionChange()
          }}
        >
          {t('buy_tab')}
        </button>
        <button
          className={`${styles.tab} ${tab === 'remove' ? styles.tabActive : ''}`}
          onClick={() => {
            setTab('remove')
            playButtonSFX()
            haptics.selectionChange()
          }}
        >
          {t('remove_tab')}
        </button>
      </div>

      {tab === 'buy' && (
        <div className={styles.shopGrid}>
          <button
            className={`${styles.shopCard} ${styles.healCard}`}
            onClick={heal}
            disabled={!player || player.tokens < 15 || player.hp >= player.maxHp}
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
            <span className={styles.shopCost}>🪙 15</span>
          </button>

          {shopSymbols.map((symbol) => {
            const cost = SYMBOL_COST[symbol.rarity]
            const canAfford = (player?.tokens ?? 0) >= cost
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
          {player?.reels.map((reel, reelIndex) => (
            <div key={reel.id} className={styles.reelGroup}>
              <span className={styles.reelLabel}>
                {t('reel')} {reelIndex + 1}
              </span>
              <div className={styles.reelSymbols}>
                {reel.symbolPool.map((weightedSymbol, symbolIndex) => (
                  <button
                    key={`${weightedSymbol.symbol.id}-${symbolIndex}`}
                    className={styles.removeBtn}
                    onClick={() => removeSymbol(weightedSymbol.symbol.id, reelIndex)}
                    disabled={reel.symbolPool.length <= 1}
                    title={`${t('remove_symbol')} ${localizeSymbolName(weightedSymbol.symbol)}`}
                  >
                    <GameIcon
                      icon={weightedSymbol.symbol.icon}
                      alt={localizeSymbolName(weightedSymbol.symbol)}
                      className={styles.removeIcon}
                    />
                    <span className={styles.removeX}>✕</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className={styles.proceedBtn} onClick={proceed}>
        {'>'} {t('continue')}
      </button>
    </motion.div>
  )
}
