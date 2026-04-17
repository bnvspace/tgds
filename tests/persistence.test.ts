import { describe, expect, it } from 'vitest'
import { buildPersistedSnapshot } from '@/store/persistence'
import type { Enemy, GameState, Player } from '@/types'

const player: Player = {
  hp: 72,
  maxHp: 100,
  armor: 5,
  reels: [{ id: 'reel_1' }, { id: 'reel_2' }, { id: 'reel_3' }],
  symbolInventory: [],
  relics: [],
  tokens: 18,
  bombCharge: 2,
  metaModifiers: [],
  fightsWon: 3,
  extraLives: 1,
}

const enemy: Enemy = {
  id: 'bog-slime',
  name: 'Bog Slime',
  icon: 'slime.png',
  zone: 'arena',
  hp: 21,
  maxHp: 30,
  armor: 2,
  attackPattern: [{ damage: 5, type: 'physical', description: 'slam' }],
  patternIndex: 0,
  statusEffects: [],
  blockedReels: [],
  isBoss: false,
}

function buildState(overrides: Partial<GameState>): GameState {
  return {
    phase: 'world_map',
    currentZone: 'arena',
    worldTier: 4,
    player,
    currentEnemy: null,
    mapNodes: [
      {
        id: 'arena-1',
        type: 'combat',
        zone: 'arena',
        visited: true,
        connections: [],
        position: { x: 0, y: 0 },
      },
    ],
    currentNodeId: 'arena-1',
    lastSpinResult: null,
    lastCombatReward: null,
    meta: {
      totalChips: 120,
      unlockedSymbolIds: ['dagger'],
      unlockedStarterSymbolIds: ['dagger', 'shield', 'coin'],
      allocatedModifiers: [],
      language: 'ru',
      isMuted: false,
      isHapticsEnabled: true,
    },
    ...overrides,
  }
}

describe('buildPersistedSnapshot', () => {
  it('drops non-combat progress back to menu state', () => {
    const snapshot = buildPersistedSnapshot(buildState({ phase: 'shop' }))

    expect(snapshot.phase).toBe('meta_menu')
    expect(snapshot.player).toBeNull()
    expect(snapshot.currentEnemy).toBeNull()
    expect(snapshot.currentZone).toBe('swamp')
    expect(snapshot.worldTier).toBe(0)
    expect(snapshot.mapNodes).toEqual([])
    expect(snapshot.lastCombatReward).toBeNull()
  })

  it('keeps active combat state resumable after relaunch', () => {
    const snapshot = buildPersistedSnapshot(buildState({
      phase: 'enemy_action',
      currentEnemy: enemy,
    }))

    expect(snapshot.phase).toBe('combat_start')
    expect(snapshot.player).toEqual(player)
    expect(snapshot.currentEnemy).toEqual(enemy)
    expect(snapshot.currentZone).toBe('arena')
    expect(snapshot.worldTier).toBe(4)
  })
})
