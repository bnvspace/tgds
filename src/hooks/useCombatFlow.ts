import { useEffect, useRef, useState } from 'react'
import type { GamePhase, GameSymbol, QTETier } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import { spin, makeQTEResult, isJackpotSpin } from '@/game/slotGenerator'
import { resolveSymbols } from '@/game/resolution'
import {
  playButtonSFX,
  playCoinSFX,
  playErrorSFX,
  playHealSFX,
  playHitSFX,
  playShieldSFX,
} from '@/utils/audio'
import { haptics } from '@/utils/haptics'
import type { SlotMachineHandle } from '@/components/SlotMachine'

export type CombatUiPhase =
  | 'player_idle'
  | 'spinning'
  | 'qte_active'
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
    case 'qte_active':
      return t('tap_qte')
    case 'resolving':
      return t('qte_wait_hint')
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

  const [combatPhase, setCombatPhase] = useState<CombatUiPhase>('player_idle')
  const [combatLog, setCombatLog] = useState<string[]>([t('combat_start')])
  const [showFleeConfirm, setShowFleeConfirm] = useState(false)
  const [qteSessionId, setQteSessionId] = useState(0)

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

    const pattern = liveEnemy.attackPattern[liveEnemy.patternIndex]
    const attackType = pattern.type
    const effectiveDamage = attackType === 'debuff'
      ? pattern.damage
      : Math.max(0, pattern.damage - livePlayer.armor)

    damagePlayer(pattern.damage, attackType)
    playErrorSFX()
    haptics.damageTaken()
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
    hasPlayerActedRef.current = false
    setShowFleeConfirm(false)
    combatLogRef.current = [t('combat_start')]
    setCombatLog(combatLogRef.current)
    setCombatPhase('player_idle')
    if (useGameStore.getState().phase !== 'combat_start') {
      setPhase('combat_start')
    }
  }, [enemy, player, setPhase, t])

  async function resolveSpinOutcome(symbols: GameSymbol[], qteTier: QTETier | null) {
    if (!player || !enemy) return

    pendingRef.current = []
    setCombatPhase('resolving')
    syncCombatStorePhase('resolving')

    const qte = makeQTEResult(qteTier ?? 'miss')
    const result = resolveSymbols(symbols, qte, player)

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
      result.matchGroups.length > 0
        ? result.matchGroups.map((group) => (
          `${t('match3_label')} ${localizeSymbolName(group.symbol)}`
        )).join(', ')
        : null,
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
      const finalCombatLog = log(t('enemy_defeated'))
      haptics.victory()
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

    if (combatPhase === 'spinning') {
      slotRef.current?.stopNextReel()
      return
    }

    if (combatPhase !== 'player_idle') return

    hasPlayerActedRef.current = true
    resetPlayerArmor()
    setCombatPhase('spinning')
    syncCombatStorePhase('player_spin')
    log(t('spin_reels'))

    const symbols = spin(player.reels)
    pendingRef.current = symbols

    if (slotRef.current) {
      await slotRef.current.spinTo(symbols)
    }

    if (isJackpotSpin(symbols)) {
      setQteSessionId((current) => current + 1)
      setCombatPhase('qte_active')
      log(t('tap_qte'))
      return
    }

    await resolveSpinOutcome(symbols, null)
  }

  async function handleQTEResult(tier: QTETier) {
    if (!player || !enemy || pendingRef.current.length === 0) return

    const symbols = pendingRef.current
    await resolveSpinOutcome(symbols, tier)
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
    qteSessionId,
    handleSpin,
    handleQTEResult,
    handleFlee,
    confirmFlee,
    cancelFlee,
  }
}
