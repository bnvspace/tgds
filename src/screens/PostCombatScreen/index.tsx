import { useEffect, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { shopBackdrop, symbolIconById, zoneBackdropByZone } from '@/assets/pixelArt'
import GameIcon from '@/components/GameIcon'
import { useTranslation } from '@/i18n'
import { useGameStore } from '@/store/gameStore'
import type { CombatRewardOption, GameSymbol } from '@/types'
import { playButtonSFX } from '@/utils/audio'
import { haptics } from '@/utils/haptics'
import { triggerRewardBurst } from '@/components/RewardBurstLayer'
import styles from './PostCombatScreen.module.css'

export default function PostCombatScreen() {
  const reward = useGameStore((state) => state.lastCombatReward)
  const player = useGameStore((state) => state.player)
  const setPhase = useGameStore((state) => state.setPhase)
  const clearCombatReward = useGameStore((state) => state.clearCombatReward)
  const claimCombatRewardOption = useGameStore((state) => state.claimCombatRewardOption)
  const { t, localizeEnemyName, localizeSymbolName } = useTranslation()

  function effectDescription(symbol: GameSymbol) {
    const { effect } = symbol
    const parts: string[] = []

    if (effect.damage) parts.push(`${effect.damage * symbol.level} ${t('dmg')}`)
    if (effect.magicDamage) parts.push(`✨ ${effect.magicDamage * symbol.level} ${t('magic')}`)
    if (effect.armor) parts.push(`+${effect.armor * symbol.level} ${t('armor')}`)
    if (effect.tokens) parts.push(`+${effect.tokens * symbol.level} ${t('tokens')}`)
    if (effect.heal) parts.push(`+${effect.heal * symbol.level} ${t('heal')}`)
    if (effect.poisonStacks) parts.push(`☠ +${effect.poisonStacks * symbol.level}/${t('turn')}`)
    if (effect.stunTurns) parts.push(`⚡ ${t('status_stunned')}`)

    return parts.join('  ') || t('no_effect')
  }

  useEffect(() => {
    if (reward && reward.chipReward > 0) {
      setTimeout(() => {
        triggerRewardBurst('chip', reward.chipReward)
      }, 500)
    }
  }, [reward])

  function proceed() {
    playButtonSFX()
    haptics.selectionChange()
    clearCombatReward()
    setPhase('shop')
  }

  function claimReward(option: CombatRewardOption) {
    playButtonSFX()

    if (option.type === 'heal') {
      haptics.heal()
    } else if (option.type === 'tokens') {
      haptics.coinPickup()
    } else {
      haptics.selectionChange()
    }

    claimCombatRewardOption(option.id)
  }

  if (!reward) {
    return (
      <div className={styles.screen} style={{ '--reward-backdrop': `url("${shopBackdrop}")` } as CSSProperties}>
        <button type="button" className={styles.proceedBtn} onClick={proceed}>
          {'>'} {t('continue')}
        </button>
      </div>
    )
  }

  const screenStyle = {
    '--reward-backdrop': `url("${zoneBackdropByZone[reward.zone]}")`,
  } as CSSProperties
  const combatLog = reward.combatLog ?? []
  const rewardOptions = reward.options ?? []
  const newUnlocks = reward.newUnlocks ?? []

  return (
    <motion.div
      className={styles.screen}
      style={screenStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <section className={styles.heroPanel}>
        <span className={styles.kicker}>{t('enemy_defeated')}</span>
        <div className={styles.enemyFrame}>
          <GameIcon
            icon={reward.enemyIcon}
            alt={localizeEnemyName({ id: reward.enemyId, name: reward.enemyName })}
            className={styles.enemyIcon}
          />
        </div>
        <h2 className={styles.enemyName}>
          {localizeEnemyName({ id: reward.enemyId, name: reward.enemyName })}
        </h2>
        <p className={styles.subtitle}>{t('shop_title')}</p>
      </section>

      <section className={styles.summaryPanel}>
        <div className={styles.rewardGrid}>
          <div className={styles.rewardCard}>
            <GameIcon
              icon={symbolIconById.coin}
              alt={t('tokens')}
              className={styles.rewardIcon}
            />
            <div className={styles.rewardCopy}>
              <span className={styles.rewardLabel}>{t('tokens_short')}</span>
              <span className={styles.rewardValue}>+{reward.tokenReward}</span>
            </div>
          </div>

          <div className={styles.rewardCard}>
            <GameIcon
              icon={symbolIconById.health_potion}
              alt={t('hp_label')}
              className={styles.rewardIcon}
            />
            <div className={styles.rewardCopy}>
              <span className={styles.rewardLabel}>{t('hp_label')}</span>
              <span className={styles.rewardValue}>
                {player?.hp ?? 0}/{player?.maxHp ?? 0}
              </span>
            </div>
          </div>

          {reward.chipReward > 0 && (
            <div className={styles.rewardCard} data-tone="chips">
              <span className={styles.chipEmoji}>🟢</span>
              <div className={styles.rewardCopy}>
                <span className={styles.rewardLabel}>{t('chips')}</span>
                <span className={styles.rewardValue} style={{ color: '#4caf91' }}>+{reward.chipReward}</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.totalPanel}>
          <span className={styles.totalLabel}>{t('tokens')}</span>
          <span className={styles.totalValue}>{player?.tokens ?? 0}</span>
        </div>

        {newUnlocks.length > 0 && (
          <section className={styles.unlockSection}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionTitle}>{t('new_unlocks')}</span>
              <span className={styles.sectionHint}>{t('new_unlocks_hint')}</span>
            </div>

            <div className={styles.unlockGrid}>
              {newUnlocks.map((symbol) => (
                <div key={symbol.id} className={styles.unlockCard}>
                  <div className={styles.unlockIconFrame}>
                    <GameIcon
                      icon={symbol.icon}
                      alt={localizeSymbolName(symbol)}
                      className={styles.unlockIcon}
                    />
                  </div>
                  <div className={styles.unlockBody}>
                    <span className={styles.choiceName}>{localizeSymbolName(symbol)}</span>
                    <span className={styles.choiceEffect}>{effectDescription(symbol)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {rewardOptions.length > 0 && (
          <section className={styles.choiceSection}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionTitle}>{t('choose_reward')}</span>
              <span className={styles.sectionHint}>{t('choose_reward_hint')}</span>
            </div>

            <div className={styles.choiceGrid}>
              {rewardOptions.map((option) => {
                const symbol = option.type === 'symbol' ? option.symbol : undefined
                const icon = symbol
                  ? symbol.icon
                  : option.type === 'heal'
                    ? symbolIconById.health_potion
                    : symbolIconById.coin
                const title = symbol
                  ? localizeSymbolName(symbol)
                  : option.type === 'heal'
                    ? t('reward_heal_title')
                    : t('reward_tokens_title')
                const description = symbol
                  ? effectDescription(symbol)
                  : option.type === 'heal'
                    ? `+${option.amount ?? 0} ${t('hp_label')}`
                    : `+${option.amount ?? 0} ${t('tokens_short')}`
                const hint = symbol
                  ? t('reward_symbol_hint')
                  : option.type === 'heal'
                    ? t('reward_heal_hint')
                    : t('reward_tokens_hint')

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={styles.choiceCard}
                    data-tone={option.type}
                    onClick={() => claimReward(option)}
                  >
                    <div className={styles.choiceIconFrame}>
                      <GameIcon
                        icon={icon}
                        alt={title}
                        className={styles.choiceIcon}
                      />
                    </div>

                    <div className={styles.choiceBody}>
                      <div className={styles.choiceMeta}>
                        {symbol ? (
                          <>
                            <span className={styles.rarityBadge} data-rarity={symbol.rarity}>
                              {t(`rarity_${symbol.rarity}`)}
                            </span>
                            <span className={styles.typeBadge}>
                              {t(`symbol_type_${symbol.type}`)}
                            </span>
                          </>
                        ) : (
                          <span className={styles.typeBadge}>
                            {option.type === 'heal' ? t('heal') : t('tokens')}
                          </span>
                        )}
                      </div>

                      <span className={styles.choiceName}>{title}</span>
                      <span className={styles.choiceEffect}>{description}</span>
                      <span className={styles.choiceHint}>{hint}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <section className={styles.logPanel} aria-label={t('combat_log')}>
          <div className={styles.logHeader}>
            <span className={styles.logTitle}>{t('combat_log')}</span>
            <span className={styles.logCount}>{combatLog.length}</span>
          </div>

          <ol className={styles.logList}>
            {combatLog.map((entry, index) => (
              <li key={`${index}-${entry}`} className={styles.logItem}>
                <span className={styles.logIndex}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.logLine}>{entry}</span>
              </li>
            ))}
          </ol>
        </section>
      </section>

      {rewardOptions.length === 0 && (
        <button type="button" className={styles.proceedBtn} onClick={proceed}>
          {'>'} {t('continue')}
        </button>
      )}
    </motion.div>
  )
}
