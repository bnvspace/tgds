import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import EnemyDisplay from '@/components/EnemyDisplay'
import SlotMachine from '@/components/SlotMachine'
import type { SlotMachineHandle } from '@/components/SlotMachine'
import QTEBar from '@/components/QTEBar'
import { spin } from '@/game/slotGenerator'
import { resolveSymbols } from '@/game/resolution'
import { makeQTEResult, checkMegaCrit } from '@/game/slotGenerator'
import type { GameSymbol, QTETier } from '@/types'
import styles from './CombatScreen.module.css'

const DEV_ENEMY = {
  id: 'goblin',
  name: 'Hammer Goblin',
  icon: '👺',
  zone: 'sewer' as const,
  hp: 60,
  maxHp: 60,
  attackPattern: [
    { damage: 12, type: 'physical' as const, description: 'Hammer swing' },
    { damage: 8,  type: 'physical' as const, description: 'Quick jab' },
    { damage: 10, type: 'magical'  as const, description: 'Poison spit' },
  ],
  patternIndex: 0,
  statusEffects: [],
  blockedReels: [],
  isBoss: false,
}

type CombatPhase = 'player_idle' | 'spinning' | 'qte_active' | 'resolving' | 'enemy_turn' | 'done'

export default function CombatScreen() {
  const player = useGameStore((s) => s.player)
  const currentEnemy = useGameStore((s) => s.currentEnemy)
  const setEnemy = useGameStore((s) => s.setEnemy)
  const resetArmor = useGameStore((s) => s.resetArmor)
  const applySpinResult = useGameStore((s) => s.applySpinResult)
  const applyDamageToEnemy = useGameStore((s) => s.applyDamageToEnemy)
  const damagePlayer = useGameStore((s) => s.damagePlayer)
  const advanceEnemyPattern = useGameStore((s) => s.advanceEnemyPattern)
  const setPhase = useGameStore((s) => s.setPhase)

  const slotRef = useRef<SlotMachineHandle>(null)
  const pendingRef = useRef<GameSymbol[]>([])

  const [combatPhase, setCombatPhase] = useState<CombatPhase>('player_idle')
  const [combatLog, setCombatLog] = useState<string[]>(['⚔ Combat started!'])

  useEffect(() => {
    if (!currentEnemy) setEnemy(DEV_ENEMY)
  }, [])

  const enemy = currentEnemy ?? DEV_ENEMY
  const hpPercent = player ? (player.hp / player.maxHp) * 100 : 0

  function log(msg: string) {
    setCombatLog((prev) => [...prev.slice(-5), msg])
  }

  // ── SPIN ─────────────────────────────────────────────────
  async function handleSpin() {
    if (!player || combatPhase !== 'player_idle') return

    resetArmor()  // per GDD: armor resets at start of PLAYER_SPIN_PHASE
    setCombatPhase('spinning')
    log('🎰 Spinning reels...')

    // Determine results BEFORE animation (per GDD requirement 11)
    const symbols = spin(player.reels)
    pendingRef.current = symbols

    // Trigger real reel animation (staggered, with inertia)
    if (slotRef.current) {
      await slotRef.current.spinTo(symbols)
    }

    // ── QTE activates after last reel stops ─────────────────
    setCombatPhase('qte_active')
    log('▶ TAP the QTE bar!')
  }

  // ── QTE RESULT → RESOLVE ─────────────────────────────────
  async function handleQTEResult(tier: QTETier) {
    if (!player || !pendingRef.current.length) return
    setCombatPhase('resolving')

    const symbols = pendingRef.current
    const isMega = checkMegaCrit(symbols, tier)
    const qte = makeQTEResult(isMega ? 'mega_crit' : tier)
    const result = resolveSymbols(symbols, qte, player, enemy)

    applySpinResult(result)
    applyDamageToEnemy(result.totalDamage)

    const line = [
      qte.tier !== 'miss' ? `✨ ${qte.tier.toUpperCase()} ×${qte.multiplier}` : '💨 Miss',
      result.synergiesActivated.length
        ? `🔥 ${result.synergiesActivated.map((s) => s.name).join(', ')}`
        : null,
      result.totalDamage > 0 ? `⚔ ${Math.round(result.totalDamage)} dmg` : null,
      result.totalArmor > 0 ? `🛡 +${result.totalArmor}` : null,
      result.totalTokens > 0 ? `🪙 +${result.totalTokens}` : null,
    ].filter(Boolean).join('  ')
    log(line)

    // Check enemy death
    if (enemy.hp - result.totalDamage <= 0) {
      log('💀 Enemy defeated!')
      setCombatPhase('done')
      setTimeout(() => setPhase('shop'), 1200)
      return
    }

    // ── ENEMY TURN ─────────────────────────────────────────
    setCombatPhase('enemy_turn')
    await new Promise((r) => setTimeout(r, 700))

    const pattern = enemy.attackPattern[enemy.patternIndex]
    damagePlayer(pattern.damage, pattern.type)
    log(`👺 "${pattern.description}" — ${pattern.damage} ${pattern.type}`)
    advanceEnemyPattern()

    // Check player death
    if (player.hp - pattern.damage <= 0) {
      log('💀 You died...')
      setCombatPhase('done')
      setTimeout(() => setPhase('game_over'), 1200)
      return
    }

    await new Promise((r) => setTimeout(r, 400))
    setCombatPhase('player_idle')
  }

  return (
    <div className={styles.screen}>
      <EnemyDisplay enemy={enemy} />

      {/* Player HP bar */}
      <div className={styles.playerBar}>
        <div className={styles.playerBarTop}>
          <span className={styles.playerLabel}>HP</span>
          <span className={styles.hpValues}>{player?.hp ?? 0}/{player?.maxHp ?? 100}</span>
          <span className={styles.armor}>🛡 {player?.armor ?? 0}</span>
          <span className={styles.tokens}>🪙 {player?.tokens ?? 0}</span>
        </div>
        <div className={styles.hpBarTrack}>
          <motion.div
            className={styles.hpBarFill}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* QTE bar */}
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

      {/* Combat log */}
      <div className={styles.log}>
        {combatLog.map((line, i) => (
          <p
            key={`${line}-${i}`}
            className={styles.logLine}
            style={{ color: i === combatLog.length - 1 ? '#c8a96e' : undefined }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Slot machine with real reel animation */}
      {player && (
        <SlotMachine
          ref={slotRef}
          reels={player.reels}
          isSpinning={combatPhase === 'spinning'}
          onSpin={handleSpin}
          disabled={combatPhase !== 'player_idle'}
        />
      )}
    </div>
  )
}
