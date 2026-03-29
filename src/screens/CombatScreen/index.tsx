import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import EnemyDisplay from '@/components/EnemyDisplay'
import SlotMachine from '@/components/SlotMachine'
import type { SlotMachineHandle } from '@/components/SlotMachine'
import QTEBar from '@/components/QTEBar'
import { spin, makeQTEResult, isJackpotSpin } from '@/game/slotGenerator'
import { resolveSymbols } from '@/game/resolution'
import { playButtonSFX, playCoinSFX, playErrorSFX, playHealSFX, playHitSFX, playShieldSFX } from '@/utils/audio'
import { haptics } from '@/utils/haptics'
import { useTranslation } from '@/i18n'
import type { GameSymbol, QTETier } from '@/types'
import styles from './CombatScreen.module.css'

const DEV_ENEMY = {
  id: 'hammer_goblin',
  name: 'Hammer Goblin',
  icon: '\u{1F47A}',
  zone: 'sewer' as const,
  hp: 60,
  maxHp: 60,
  attackPattern: [
    { damage: 12, type: 'physical' as const, description: 'Hammer swing' },
    { damage: 8, type: 'physical' as const, description: 'Quick jab' },
    { damage: 10, type: 'magical' as const, description: 'Poison spit' },
  ],
  patternIndex: 0,
  statusEffects: [],
  blockedReels: [],
  isBoss: false,
}

type CombatPhase = 'player_idle' | 'spinning' | 'qte_active' | 'resolving' | 'enemy_turn' | 'done'

export default function CombatScreen() {
  const player = useGameStore((state) => state.player)
  const currentEnemy = useGameStore((state) => state.currentEnemy)
  const setEnemy = useGameStore((state) => state.setEnemy)
  const applySpinResult = useGameStore((state) => state.applySpinResult)
  const applyDamageToEnemy = useGameStore((state) => state.applyDamageToEnemy)
  const damagePlayer = useGameStore((state) => state.damagePlayer)
  const advanceEnemyPattern = useGameStore((state) => state.advanceEnemyPattern)
  const recordCombatVictory = useGameStore((state) => state.recordCombatVictory)
  const setPhase = useGameStore((state) => state.setPhase)
  const endRun = useGameStore((state) => state.endRun)
  const {
    t,
    localizeAttackDescription,
    localizeAttackType,
    localizeSynergyName,
  } = useTranslation()

  const slotRef = useRef<SlotMachineHandle>(null)
  const pendingRef = useRef<GameSymbol[]>([])
  const encounterRef = useRef<string | null>(null)
  const hasPlayerActedRef = useRef(false)

  const [combatPhase, setCombatPhase] = useState<CombatPhase>('player_idle')
  const [combatLog, setCombatLog] = useState<string[]>([t('combat_start')])
  const [showFleeConfirm, setShowFleeConfirm] = useState(false)

  useEffect(() => {
    if (!currentEnemy) {
      setEnemy(DEV_ENEMY)
    }
  }, [currentEnemy, setEnemy])

  const enemy = currentEnemy ?? DEV_ENEMY
  const hpPercent = player ? (player.hp / player.maxHp) * 100 : 0

  function log(message: string) {
    setCombatLog((prev) => [...prev.slice(-5), message])
  }

  async function performEnemyTurn() {
    const liveState = useGameStore.getState()
    const livePlayer = liveState.player
    const liveEnemy = liveState.currentEnemy ?? enemy

    if (!livePlayer || !liveEnemy) return
    if (!hasPlayerActedRef.current) {
      setCombatPhase('player_idle')
      return
    }

    setCombatPhase('enemy_turn')
    await new Promise((resolve) => setTimeout(resolve, 700))

    const pattern = liveEnemy.attackPattern[liveEnemy.patternIndex]
    const attackType = pattern.type === 'debuff' ? 'physical' : pattern.type
    const effectiveDamage = attackType === 'magical'
      ? pattern.damage
      : Math.max(0, pattern.damage - livePlayer.armor)

    damagePlayer(pattern.damage, attackType)
    playErrorSFX()
    haptics.damageTaken()
    log(`${t('enemy_attack')}: ${localizeAttackDescription(pattern.description)} - ${pattern.damage} ${localizeAttackType(pattern.type)}`)
    advanceEnemyPattern()

    if (livePlayer.hp - effectiveDamage <= 0) {
      log(t('you_died'))
      haptics.defeat()
      setCombatPhase('done')
      setTimeout(() => setPhase('game_over'), 1200)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 400))
    setCombatPhase('player_idle')
  }

  useEffect(() => {
    if (!player) return

    const encounterId = `${enemy.id}:${enemy.maxHp}`
    if (encounterRef.current === encounterId) return

    encounterRef.current = encounterId
    pendingRef.current = []
    hasPlayerActedRef.current = false
    setCombatLog([t('combat_start')])
    setCombatPhase('player_idle')
  }, [player, enemy.id, enemy.maxHp, t])

  async function resolveSpinOutcome(symbols: GameSymbol[], qteTier: QTETier | null) {
    if (!player) return

    pendingRef.current = []
    setCombatPhase('resolving')

    const qte = makeQTEResult(qteTier ?? 'miss')
    const result = resolveSymbols(symbols, qte, player, enemy)

    applySpinResult(result)
    applyDamageToEnemy(result.totalDamage)

    if (result.totalDamage > 0) {
      playHitSFX()
      haptics.damageDealt()
    }
    if (result.totalArmor > 0) {
      setTimeout(() => {
        playShieldSFX()
        haptics.shieldBlock()
      }, 150)
    }
    if (result.totalTokens > 0) {
      setTimeout(() => {
        playCoinSFX()
        haptics.coinPickup()
      }, 300)
    }
    if (result.totalHeal > 0) {
      setTimeout(() => {
        playHealSFX()
        haptics.heal()
      }, 450)
    }

    const logLine = [
      qteTier ? t(`qte_label_${qte.tier}`) : null,
      result.synergiesActivated.length > 0
        ? result.synergiesActivated.map((synergy) => localizeSynergyName(synergy)).join(', ')
        : null,
      result.totalDamage > 0 ? `${t('damage_short')} ${Math.round(result.totalDamage)}` : null,
      result.totalArmor > 0 ? `${t('armor_short')} +${result.totalArmor}` : null,
      result.totalTokens > 0 ? `${t('tokens_short')} +${result.totalTokens}` : null,
      result.totalHeal > 0 ? `${t('heal_short')} +${result.totalHeal}` : null,
    ].filter(Boolean).join('  ')

    if (logLine) {
      log(logLine)
    }

    if (enemy.hp - result.totalDamage <= 0) {
      recordCombatVictory(enemy)
      log(t('enemy_defeated'))
      haptics.victory()
      setCombatPhase('done')
      setTimeout(() => setPhase('shop'), 1200)
      return
    }

    await performEnemyTurn()
  }

  async function handleSpin() {
    if (!player) return

    if (combatPhase === 'spinning') {
      slotRef.current?.stopNextReel()
      return
    }

    if (combatPhase !== 'player_idle') return

    hasPlayerActedRef.current = true
    setCombatPhase('spinning')
    log(t('spin_reels'))

    const symbols = spin(player.reels)
    pendingRef.current = symbols

    if (slotRef.current) {
      await slotRef.current.spinTo(symbols)
    }

    if (isJackpotSpin(symbols)) {
      setCombatPhase('qte_active')
      log(t('tap_qte'))
      return
    }

    await resolveSpinOutcome(symbols, null)
  }

  async function handleQTEResult(tier: QTETier) {
    if (!player || pendingRef.current.length === 0) return

    const symbols = pendingRef.current
    await resolveSpinOutcome(symbols, tier)
  }

  function handleFlee() {
    playButtonSFX()
    haptics.rigid()
    setShowFleeConfirm(true)
  }

  function confirmFlee() {
    endRun(false)
  }

  function cancelFlee() {
    playButtonSFX()
    setShowFleeConfirm(false)
  }

  return (
    <div className={styles.screen}>
      <EnemyDisplay enemy={enemy} />

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

      <div className={styles.playerBar}>
        <div className={styles.playerBarTop}>
          <span className={styles.playerLabel}>{t('hp_label')}</span>
          <span className={styles.playerHpValues}>{player?.hp ?? 0}/{player?.maxHp ?? 100}</span>
          <span className={styles.armorLabel}>{t('armor_short')} {player?.armor ?? 0}</span>
          <span className={styles.tokensLabel}>{t('tokens_short')} {player?.tokens ?? 0}</span>
        </div>
        <div className={styles.hpBar}>
          <motion.div
            className={styles.hpFill}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <button
        className={styles.fleeBtn}
        onClick={handleFlee}
        disabled={combatPhase !== 'player_idle' && combatPhase !== 'done'}
      >
        {t('flee')}
      </button>

      <AnimatePresence>
        {(combatPhase === 'qte_active' || combatPhase === 'resolving') && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.8 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0 }}
            style={{ transformOrigin: 'top' }}
          >
            <QTEBar active={combatPhase === 'qte_active'} onResult={handleQTEResult} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.log}>
        {combatLog.map((line, index) => (
          <p
            key={`${line}-${index}`}
            className={styles.logLine}
            style={{ color: index === combatLog.length - 1 ? '#c8a96e' : undefined }}
          >
            {line}
          </p>
        ))}
      </div>

      {player && (
        <SlotMachine
          ref={slotRef}
          reels={player.reels}
          isSpinning={combatPhase === 'spinning'}
          onSpin={handleSpin}
          disabled={combatPhase !== 'player_idle' && combatPhase !== 'spinning'}
        />
      )}
    </div>
  )
}
