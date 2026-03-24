import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import EnemyDisplay from '@/components/EnemyDisplay'
import SlotMachine from '@/components/SlotMachine'
import type { SlotMachineHandle } from '@/components/SlotMachine'
import QTEBar from '@/components/QTEBar'
import { spin, makeQTEResult, checkMegaCrit } from '@/game/slotGenerator'
import { resolveSymbols } from '@/game/resolution'
import { playButtonSFX, playCoinSFX, playErrorSFX, playHealSFX, playHitSFX, playShieldSFX } from '@/utils/audio'
import { haptics } from '@/utils/haptics'
import { useTranslation } from '@/i18n'
import type { GameSymbol, QTETier, NodeType } from '@/types'
import styles from './CombatScreen.module.css'

const DEV_ENEMY = {
  id: 'goblin',
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

function hashSeed(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

export default function CombatScreen() {
  const player = useGameStore((state) => state.player)
  const currentEnemy = useGameStore((state) => state.currentEnemy)
  const currentNodeId = useGameStore((state) => state.currentNodeId)
  const mapNodes = useGameStore((state) => state.mapNodes)
  const setEnemy = useGameStore((state) => state.setEnemy)
  const resetArmor = useGameStore((state) => state.resetArmor)
  const applySpinResult = useGameStore((state) => state.applySpinResult)
  const applyDamageToEnemy = useGameStore((state) => state.applyDamageToEnemy)
  const damagePlayer = useGameStore((state) => state.damagePlayer)
  const advanceEnemyPattern = useGameStore((state) => state.advanceEnemyPattern)
  const recordCombatVictory = useGameStore((state) => state.recordCombatVictory)
  const setPhase = useGameStore((state) => state.setPhase)
  const endRun = useGameStore((state) => state.endRun)
  const { t } = useTranslation()

  const slotRef = useRef<SlotMachineHandle>(null)
  const pendingRef = useRef<GameSymbol[]>([])
  const encounterRef = useRef<string | null>(null)

  const [combatPhase, setCombatPhase] = useState<CombatPhase>('enemy_turn')
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

  function shouldEnemyStartFirst() {
    const currentNode = mapNodes.find((node) => node.id === currentNodeId)
    const currentNodeType: NodeType | undefined = currentNode?.type

    if (enemy.isBoss || currentNodeType === 'elite') {
      return true
    }

    const seed = `${currentNodeId ?? 'free'}:${enemy.id}`
    return hashSeed(seed) % 2 === 0
  }

  async function performEnemyTurn(openingTurn = false) {
    const liveState = useGameStore.getState()
    const livePlayer = liveState.player
    const liveEnemy = liveState.currentEnemy ?? enemy

    if (!livePlayer || !liveEnemy) return

    setCombatPhase('enemy_turn')
    await new Promise((resolve) => setTimeout(resolve, openingTurn ? 480 : 700))

    const pattern = liveEnemy.attackPattern[liveEnemy.patternIndex]
    const attackType = pattern.type === 'debuff' ? 'physical' : pattern.type
    const effectiveDamage = attackType === 'magical'
      ? pattern.damage
      : Math.max(0, pattern.damage - livePlayer.armor)

    damagePlayer(pattern.damage, attackType)
    playErrorSFX()
    haptics.damageTaken()
    log(`ENEMY "${pattern.description}" - ${pattern.damage} ${pattern.type}`)
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

    const encounterId = `${currentNodeId ?? 'free'}:${enemy.id}:${enemy.maxHp}`
    if (encounterRef.current === encounterId) return

    encounterRef.current = encounterId
    pendingRef.current = []
    setCombatLog([t('combat_start')])

    if (shouldEnemyStartFirst()) {
      void performEnemyTurn(true)
      return
    }

    setCombatPhase('player_idle')
  }, [player, currentNodeId, mapNodes, enemy.id, enemy.maxHp, t])

  async function handleSpin() {
    if (!player) return

    if (combatPhase === 'spinning') {
      slotRef.current?.stopNextReel()
      return
    }

    if (combatPhase !== 'player_idle') return

    resetArmor()
    setCombatPhase('spinning')
    log(t('spin_reels'))

    const symbols = spin(player.reels)
    pendingRef.current = symbols

    if (slotRef.current) {
      await slotRef.current.spinTo(symbols)
    }

    setCombatPhase('qte_active')
    log(t('tap_qte'))
  }

  async function handleQTEResult(tier: QTETier) {
    if (!player || pendingRef.current.length === 0) return

    setCombatPhase('resolving')

    const symbols = pendingRef.current
    const isMega = checkMegaCrit(symbols, tier)
    const qte = makeQTEResult(isMega ? 'mega_crit' : tier)
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
      qte.tier !== 'miss' ? `${qte.tier.toUpperCase()} x${qte.multiplier}` : t('miss'),
      result.synergiesActivated.length > 0
        ? result.synergiesActivated.map((synergy) => synergy.name).join(', ')
        : null,
      result.totalDamage > 0 ? `DMG ${Math.round(result.totalDamage)}` : null,
      result.totalArmor > 0 ? `ARMOR +${result.totalArmor}` : null,
      result.totalTokens > 0 ? `TOKENS +${result.totalTokens}` : null,
    ].filter(Boolean).join('  ')

    log(logLine)

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
          <span className={styles.armorLabel}>ARM {player?.armor ?? 0}</span>
          <span className={styles.tokensLabel}>TOK {player?.tokens ?? 0}</span>
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
