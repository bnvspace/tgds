import { useEffect, useRef, useState } from 'react'
import type { GamePhase, GameSymbol, TimingTier, TimingResult } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import { spin } from '@/game/slotGenerator'
import { resolveSymbols, preResolveModifiers } from '@/game/resolution'
import { evaluateStopTiming } from '@/game/skillCheck'
import {
  playButtonSFX,
  playErrorSFX,
  playHealSFX,
  playHitSFX,
  playShieldSFX,
  playMagicSFX,
  playCheerSFX,
} from '@/utils/audio'
import { haptics } from '@/utils/haptics'
import { triggerRewardBurst } from '@/components/RewardBurstLayer'
import type { SlotMachineHandle } from '@/components/SlotMachine'

export type CombatUiPhase =
  | 'player_idle'
  | 'spinning'
  | 'resolving'
  | 'enemy_turn'
  | 'done'

const ACTIVE_COMBAT_PHASES = new Set<GamePhase>([
  'combat_start',
  'player_spin',
  'resolving',
  'enemy_action',
  'turn_end',
])

function getCombatPrompt(phase: CombatUiPhase, t: (key: string) => string) {
  switch (phase) {
    case 'spinning':
      return t('stop_button')
    case 'resolving':
      return t('loading')
    case 'enemy_turn':
      return t('enemy_attack')
    case 'done':
      return t('loading')
    case 'player_idle':
    default:
      return t('spin_button')
  }
}

export function useCombatFlow() {
  const player = useGameStore((state) => state.player)
  const currentEnemy = useGameStore((state) => state.currentEnemy)
  const lastSpinResult = useGameStore((state) => state.lastSpinResult)
  const resetPlayerArmor = useGameStore((state) => state.resetPlayerArmor)
  const applySpinResult = useGameStore((state) => state.applySpinResult)
  const applyDamageToEnemy = useGameStore((state) => state.applyDamageToEnemy)
  const applyStatusToEnemy = useGameStore((state) => state.applyStatusToEnemy)
  const tickEnemyStatuses = useGameStore((state) => state.tickEnemyStatuses)
  const damagePlayer = useGameStore((state) => state.damagePlayer)
  const advanceEnemyPattern = useGameStore((state) => state.advanceEnemyPattern)
  const recordCombatVictory = useGameStore((state) => state.recordCombatVictory)
  const setPhase = useGameStore((state) => state.setPhase)
  const endRun = useGameStore((state) => state.endRun)
  const {
    t,
    localizeAttackDescription,
    localizeAttackType,
    localizeSymbolName,
    localizeSynergyName,
  } = useTranslation()

  const slotRef = useRef<SlotMachineHandle>(null)
  const pendingRef = useRef<GameSymbol[]>([])
  const encounterRef = useRef<string | null>(null)
  const hasPlayerActedRef = useRef(false)
  const encounterTokenRef = useRef(0)
  const combatLogRef = useRef<string[]>([t('combat_start')])
  const timingResultsRef = useRef<TimingResult[]>([])

  const [combatPhase, setCombatPhase] = useState<CombatUiPhase>('player_idle')
  const [combatLog, setCombatLog] = useState<string[]>([t('combat_start')])
  const [showFleeConfirm, setShowFleeConfirm] = useState(false)
  const [lastTimingTier, setLastTimingTier] = useState<TimingTier | null>(null)
  const [timingFeedbackKey, setTimingFeedbackKey] = useState(0)

  const enemy = currentEnemy
  const playerHpPercent = player ? (player.hp / player.maxHp) * 100 : 0
  const combatPrompt = getCombatPrompt(combatPhase, t)
  const canTriggerSpin = combatPhase === 'player_idle' || combatPhase === 'spinning'
  const canFlee = combatPhase === 'player_idle' || combatPhase === 'done'

  function syncCombatStorePhase(nextPhase: GamePhase) {
    if (useGameStore.getState().phase !== nextPhase) {
      setPhase(nextPhase)
    }
  }

  function log(message: string) {
    const nextLog = [...combatLogRef.current, message]
    combatLogRef.current = nextLog
    setCombatLog(nextLog)
    return nextLog
  }

  async function performEnemyTurn(encounterToken = encounterTokenRef.current) {
    const liveState = useGameStore.getState()
    const livePlayer = liveState.player
    const liveEnemy = liveState.currentEnemy

    if (!livePlayer || !liveEnemy) return
    if (!hasPlayerActedRef.current) {
      setCombatPhase('player_idle')
      syncCombatStorePhase('combat_start')
      return
    }

    setCombatPhase('enemy_turn')
    syncCombatStorePhase('enemy_action')
    await new Promise((resolve) => setTimeout(resolve, 700))
    const latestState = useGameStore.getState()
    const activeEnemy = latestState.currentEnemy
    if (
      encounterToken !== encounterTokenRef.current ||
      activeEnemy !== liveEnemy ||
      !ACTIVE_COMBAT_PHASES.has(latestState.phase)
    ) return

    // ── Tick status effects (poison, stun) ────────────────
    const { poisonDamage, wasStunned } = tickEnemyStatuses()

    if (poisonDamage > 0) {
      log(`☠ ${t('status_poison_tick')} -${poisonDamage}`)
      // Check if poison killed the enemy
      const afterPoison = useGameStore.getState().currentEnemy
      if (afterPoison && afterPoison.hp <= 0) {
        const finalLog = log(t('enemy_defeated'))
        haptics.victory()
        setCombatPhase('done')
        syncCombatStorePhase('turn_end')
        setTimeout(() => {
          recordCombatVictory(liveEnemy, finalLog)
          if (liveEnemy.isBoss) { endRun(true); return }
          setPhase('post_combat')
        }, 1200)
        return
      }
    }

    // ── Stun: skip enemy action ──────────────────────────
    if (wasStunned) {
      log(`⚡ ${t('status_stunned')}`)
      await new Promise((resolve) => setTimeout(resolve, 400))
      if (encounterToken !== encounterTokenRef.current) return
      setCombatPhase('player_idle')
      syncCombatStorePhase('combat_start')
      return
    }

    // ── Normal enemy attack ───────────────────────────────
    const pattern = liveEnemy.attackPattern[liveEnemy.patternIndex]
    const attackType = pattern.type
    const effectiveDamage = attackType === 'debuff'
      ? pattern.damage
      : Math.max(0, pattern.damage - livePlayer.armor)

    damagePlayer(pattern.damage, attackType)
    playErrorSFX()
    haptics.damageTaken()
    
    if (effectiveDamage > 0) {
      window.dispatchEvent(new CustomEvent('screenShake', { detail: { type: 'heavy' } }))
    }
    
    log(`${t('enemy_attack')}: ${localizeAttackDescription(pattern.description)} - ${pattern.damage} ${localizeAttackType(pattern.type)}`)
    advanceEnemyPattern()
    syncCombatStorePhase('turn_end')

    if (livePlayer.hp - effectiveDamage <= 0) {
      log(t('you_died'))
      haptics.defeat()
      setCombatPhase('done')
      setTimeout(() => setPhase('game_over'), 1200)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 400))
    if (encounterToken !== encounterTokenRef.current) return
    setCombatPhase('player_idle')
    syncCombatStorePhase('combat_start')
  }

  useEffect(() => {
    if (!player || !enemy) return

    const encounterId = `${enemy.id}:${enemy.maxHp}`
    if (encounterRef.current === encounterId) return

    encounterRef.current = encounterId
    encounterTokenRef.current += 1
    pendingRef.current = []
    timingResultsRef.current = []
    hasPlayerActedRef.current = false
    setShowFleeConfirm(false)
    setLastTimingTier(null)
    combatLogRef.current = [t('combat_start')]
    setCombatLog(combatLogRef.current)
    setCombatPhase('player_idle')
    if (useGameStore.getState().phase !== 'combat_start') {
      setPhase('combat_start')
    }
  }, [enemy, player, setPhase, t])

  async function resolveSpinOutcome(symbols: GameSymbol[], rawTimings: TimingResult[]) {
    if (!player || !enemy) return

    pendingRef.current = []
    setCombatPhase('resolving')
    syncCombatStorePhase('resolving')

    // Apply pre-resolve modifiers: Diamond reroll + Sawblade force-perfect
    const { symbols: modSymbols, timings: modTimings, rerollsApplied } =
      preResolveModifiers(symbols, rawTimings, player.symbolInventory)

    if (rerollsApplied.length > 0) {
      log(`🔄 ${t('reroll_applied')} [${rerollsApplied.map((i) => i + 1).join(', ')}]`)
    }

    const result = resolveSymbols(modSymbols, modTimings, player, enemy, rerollsApplied)

    applySpinResult(result)
    // Pass physical/magic separately so store can apply enemy armor
    applyDamageToEnemy({ physical: result.totalPhysicalDamage, magic: result.totalMagicDamage })

    // Apply status effects from this spin
    if (result.poisonStacksApplied > 0 || result.stunApplied) {
      applyStatusToEnemy(result.poisonStacksApplied, result.stunApplied)
    }

    if (result.totalDamage > 0 || result.totalMagicDamage > 0) {
      if (result.totalDamage > 0) playHitSFX()
      if (result.totalMagicDamage > 0) playMagicSFX()
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
        triggerRewardBurst('coin', result.totalTokens)
        haptics.coinPickup()
      }, 300)
    }
    if (result.totalHeal > 0) {
      setTimeout(() => {
        playHealSFX()
        haptics.heal()
      }, 450)
    }

    // Build timing label for log
    const timingLabel = result.bestTimingTier && result.bestTimingTier !== 'ok'
      ? `${t(`timing_${result.bestTimingTier}`)} ×${result.bestTimingTier === 'perfect' ? '2' : '1.5'}`
      : null

    const perfects = result.timingTiers ? result.timingTiers.filter((t: TimingTier) => t === 'perfect').length : 0
    const isMegaCrit = result.bestTimingTier === 'perfect' && perfects >= 3
    if (isMegaCrit || result.matchGroups.length > 0) {
      setTimeout(() => playCheerSFX(), 200)
      window.dispatchEvent(new CustomEvent('screenShake', { detail: { type: 'heavy' } }))
    } else if (result.bestTimingTier === 'perfect') {
      window.dispatchEvent(new CustomEvent('screenShake', { detail: { type: 'soft' } }))
    }

    const liveEnemy = useGameStore.getState().currentEnemy
    const armorTag = liveEnemy && liveEnemy.armor > 0 && result.totalPhysicalDamage > 0
      ? `(${t('armor_short')} ${liveEnemy.armor})`
      : null

    const logLine = [
      timingLabel,
      result.matchGroups.length > 0
        ? result.matchGroups.map((group) => (
          `${t('match3_label')} ${localizeSymbolName(group.symbol)}`
        )).join(', ')
        : null,
      result.synergiesActivated.length > 0
        ? result.synergiesActivated.map((synergy) => localizeSynergyName(synergy)).join(', ')
        : null,
      result.totalDamage > 0 ? `${t('damage_short')} ${Math.round(result.totalDamage)} ${armorTag ?? ''}`.trim() : null,
      result.totalMagicDamage > 0 ? `✨ ${Math.round(result.totalMagicDamage)}` : null,
      result.poisonStacksApplied > 0 ? `☠ +${result.poisonStacksApplied}` : null,
      result.stunApplied ? `⚡ ${t('status_stunned')}` : null,
      result.totalArmor > 0 ? `${t('armor_short')} +${result.totalArmor}` : null,
      result.totalTokens > 0 ? `${t('tokens_short')} +${result.totalTokens}` : null,
      result.totalHeal > 0 ? `${t('heal_short')} +${result.totalHeal}` : null,
      result.bombChargeGained > 0 ? `💣 ${t('bomb_charge')} +${result.bombChargeGained}` : null,
    ].filter(Boolean).join('  ')

    if (logLine) {
      log(logLine)
    }

    if (enemy.hp - result.totalDamage <= 0) {
      const finalCombatLog = log(t('enemy_defeated'))
      haptics.victory()
      playCheerSFX()
      setCombatPhase('done')
      syncCombatStorePhase('turn_end')
      setTimeout(() => {
        recordCombatVictory(enemy, finalCombatLog)
        if (enemy.isBoss) {
          endRun(true)
          return
        }

        setPhase('post_combat')
      }, 1200)
      return
    }

    await performEnemyTurn(encounterTokenRef.current)
  }

  async function handleSpin() {
    if (!player || !enemy) return

    // When spinning — each press stops the next reel
    if (combatPhase === 'spinning') {
      const result = await slotRef.current?.stopNextReel()
      if (!result) return

      const reelIndex = timingResultsRef.current.length
      const symbols = pendingRef.current

      // Evaluate timing for the stopped reel
      // targetOffset = 0 means "ideal is cell-aligned", which is always 0
      const timing = evaluateStopTiming(result.offset, 0)
      timingResultsRef.current.push(timing)

      // Flash visual feedback on the reel
      if (timing.tier !== 'ok') {
        slotRef.current?.flashReelTiming(reelIndex, timing.tier)
        setLastTimingTier(timing.tier)
        setTimingFeedbackKey((k) => k + 1)

        // Enhanced haptic for good timing
        if (timing.tier === 'perfect') {
          haptics.impactHeavy()
        } else {
          haptics.impactMedium()
        }
      }

      // If all reels stopped, resolve
      if (timingResultsRef.current.length >= symbols.length) {
        await resolveSpinOutcome(symbols, timingResultsRef.current)
      }
      return
    }

    if (combatPhase !== 'player_idle') return

    hasPlayerActedRef.current = true
    resetPlayerArmor()
    setCombatPhase('spinning')
    syncCombatStorePhase('player_spin')
    log(t('spin_reels'))
    setLastTimingTier(null)
    timingResultsRef.current = []

    const symbols = spin(player.symbolInventory, player.reels.length)
    if (symbols.length === 0) {
      setCombatPhase('player_idle')
      syncCombatStorePhase('combat_start')
      return
    }
    pendingRef.current = symbols

    if (slotRef.current) {
      await slotRef.current.spinTo(symbols)
    }

    // No more QTE bar — all timing is evaluated per-reel stop
    // If there are symbols pending, they'll be resolved after all stops
  }

  function handleFlee() {
    playButtonSFX()
    haptics.rigid()
    setShowFleeConfirm(true)
  }

  function confirmFlee() {
    setShowFleeConfirm(false)
    endRun(false)
  }

  function cancelFlee() {
    playButtonSFX()
    setShowFleeConfirm(false)
  }

  return {
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
  }
}
