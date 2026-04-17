import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { zoneBackdropByZone } from '@/assets/pixelArt'
import EnemyDisplay from '@/components/EnemyDisplay'
import SlotMachine from '@/components/SlotMachine'
import TimingFeedback from '@/components/TimingFeedback'
import { useTranslation } from '@/i18n'
import { useCombatFlow } from '@/hooks/useCombatFlow'
import styles from './CombatScreen.module.css'

export default function CombatScreen() {
  const {
    slotRef,
    player,
    enemy,
    lastSpinResult,
    combatPhase,
    combatLog,
    showFleeConfirm,
    combatPrompt,
    playerHpPercent,
    canTriggerSpin,
    canFlee,
    lastTimingTier,
    timingFeedbackKey,
    handleSpin,
    handleFlee,
    confirmFlee,
    cancelFlee,
  } = useCombatFlow()
  const { t } = useTranslation()

  if (!player || !enemy) {
    return <div className={styles.screen} />
  }

  const screenStyle = {
    '--combat-backdrop': `url("${zoneBackdropByZone[enemy.zone]}")`,
  } as CSSProperties

  return (
    <div className={styles.screen} style={screenStyle}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.kicker}>{t('combat_start')}</span>
          <span className={styles.promptChip} data-phase={combatPhase}>
            {combatPrompt}
          </span>
        </div>
        <button
          className={styles.fleeBtn}
          onClick={handleFlee}
          disabled={!canFlee}
        >
          {t('flee')}
        </button>
      </div>

      <EnemyDisplay
        enemy={enemy}
        playerArmor={player.armor}
        combatPhase={combatPhase}
        lastSpinResult={lastSpinResult}
      />

      <section className={styles.playerPanel}>
        <div className={styles.playerPanelTop}>
          <div className={styles.hpSummary}>
            <span className={styles.playerLabel}>{t('hp_label')}</span>
            <span className={styles.playerHpValues}>
              {player.hp}/{player.maxHp}
            </span>
          </div>

          <div className={styles.statChips}>
            <span className={styles.statChip} data-tone="armor">
              {t('armor_short')} {player.armor}
            </span>
            <span className={styles.statChip} data-tone="tokens">
              {t('tokens_short')} {player.tokens}
            </span>
          </div>
        </div>

        <div className={styles.hpBar}>
          <motion.div
            className={styles.hpFill}
            initial={false}
            animate={{ width: `${playerHpPercent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </section>

      <section className={styles.feedPanel} aria-label={t('battle_feed')}>
        <div className={styles.feedHeader}>
          <span className={styles.feedTitle}>{t('battle_feed')}</span>
          <span className={styles.feedCount}>{combatLog.length}</span>
        </div>
        <div className={styles.feedList}>
          {combatLog.slice(-3).map((entry, index) => (
            <p key={`${index}-${entry}`} className={styles.feedLine}>
              {entry}
            </p>
          ))}
        </div>
      </section>

      {showFleeConfirm && (
        <div className={styles.fleeOverlay}>
          <div className={styles.fleeDialog}>
            <p className={styles.fleeQuestion}>{t('flee')}?</p>
            <p className={styles.fleeWarning}>{t('flee_warning')}</p>
            <div className={styles.fleeActions}>
              <button className={styles.fleeConfirmBtn} onClick={confirmFlee}>
                {t('flee')}
              </button>
              <button className={styles.fleeCancelBtn} onClick={cancelFlee}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.slotWrap}>
        <TimingFeedback
          tier={lastTimingTier}
          sessionKey={timingFeedbackKey}
        />
        <SlotMachine
          ref={slotRef}
          reelCount={player.reels.length}
          symbolPool={player.symbolInventory.map((entry) => entry.symbol)}
          isSpinning={combatPhase === 'spinning'}
          onSpin={handleSpin}
          disabled={!canTriggerSpin}
        />
      </div>
    </div>
  )
}
