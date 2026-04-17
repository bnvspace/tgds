import type { Enemy, GamePhase, GameState, MetaProgress, Player } from '@/types'

const RESUMABLE_COMBAT_PHASES = new Set<GamePhase>([
  'combat_start',
  'player_spin',
  'resolving',
  'enemy_action',
  'turn_end',
])

export type PersistedGameState = Partial<GameState> & {
  meta?: Partial<MetaProgress>
}

export const MENU_PERSISTED_STATE = {
  phase: 'meta_menu' as const,
  currentZone: 'swamp' as const,
  worldTier: 0,
  player: null,
  currentEnemy: null,
  mapNodes: [],
  currentNodeId: null,
  lastSpinResult: null,
  lastCombatReward: null,
}

export function shouldResumeCombatSession(
  phase: GamePhase | 'initial_shop',
  player: Player | null,
  currentEnemy: Enemy | null,
) {
  return phase !== 'initial_shop'
    && RESUMABLE_COMBAT_PHASES.has(phase)
    && !!player
    && !!currentEnemy
}

export function normalizePersistedPhase(
  phase: GamePhase | 'initial_shop',
  player: Player | null,
  currentEnemy: Enemy | null,
): GamePhase {
  return shouldResumeCombatSession(phase, player, currentEnemy)
    ? 'combat_start'
    : 'meta_menu'
}

export function buildPersistedSnapshot(state: GameState): PersistedGameState {
  if (!shouldResumeCombatSession(state.phase, state.player, state.currentEnemy)) {
    return {
      ...MENU_PERSISTED_STATE,
      meta: state.meta,
    }
  }

  return {
    phase: 'combat_start',
    currentZone: state.currentZone,
    worldTier: state.worldTier,
    player: state.player,
    currentEnemy: state.currentEnemy,
    mapNodes: state.mapNodes,
    currentNodeId: state.currentNodeId,
    lastSpinResult: state.lastSpinResult,
    lastCombatReward: null,
    meta: state.meta,
  }
}
