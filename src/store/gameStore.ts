import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CombatReward,
  CombatRewardOption,
  GameState,
  GamePhase,
  Player,
  Enemy,
  SpinResult,
  MetaProgress,
  GameSymbol,
} from '@/types'
import type { ModifierId } from '@/types'
import { ALL_SYMBOLS, BASE_STARTER_SYMBOL_IDS, STARTER_REELS } from '@/game/symbols'
import { BALANCE, CONFIG } from '@/constants'
import { generateWorldMap } from '@/game/worldMap'
import { haptics } from '@/utils/haptics'

const DEFAULT_META: MetaProgress = {
  totalChips: 100, // Starting chips so modifiers are immediately usable
  unlockedSymbolIds: ['dagger', 'shield', 'coin', 'energizer', 'bomb', 'diamond'],
  unlockedStarterSymbolIds: [...BASE_STARTER_SYMBOL_IDS],
  allocatedModifiers: [],
  language: 'ru', // Default language
  isMuted: false, // Default sound on
  isHapticsEnabled: true,
}

export const BOSS_CHIPS_REWARD = 20
const TOKEN_REWARD_BY_ZONE = {
  swamp: 8,
  sewer: 12,
  citadel: 16,
} as const
const BONUS_TOKEN_REWARD_BY_ZONE = {
  swamp: 6,
  sewer: 8,
  citadel: 10,
} as const
const SYMBOL_REWARD_COUNT = 2
const SYMBOL_UNLOCK_MILESTONES = [
  { fightsWon: 2, symbolId: 'poison_vial' },
  { fightsWon: 4, symbolId: 'magic_scroll' },
  { fightsWon: 6, symbolId: 'health_potion' },
] as const
const STARTER_SYMBOL_UNLOCK_MILESTONES = [
  { fightsWon: 2, symbolId: 'energizer' },
  { fightsWon: 4, symbolId: 'bomb' },
  { fightsWon: 6, symbolId: 'diamond' },
] as const

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function nextSeed(seed: number) {
  return (seed * 1664525 + 1013904223) >>> 0
}

function buildStarterReels(reelCount: number) {
  return Array.from({ length: reelCount }, (_, index) => {
    const template = STARTER_REELS[index % STARTER_REELS.length]

    return {
      id: `reel_${index + 1}`,
      symbolPool: template.symbolPool.map((weightedSymbol) => ({
        ...weightedSymbol,
      })),
    }
  })
}

const DEFAULT_PLAYER: Player = {
  hp: 100,
  maxHp: 100,
  armor: 0,
  reels: STARTER_REELS,
  relics: [],
  tokens: 0,
  bombCharge: 0,
  metaModifiers: [],
  fightsWon: 0,
}

// Full initial state
const INITIAL: GameState = {
  phase: 'meta_menu',
  currentZone: 'swamp',
  worldTier: 0,
  player: null,
  currentEnemy: null,
  mapNodes: [],
  currentNodeId: null,
  lastSpinResult: null,
  lastCombatReward: null,
  meta: DEFAULT_META,
}

const RESUMABLE_COMBAT_PHASES = new Set<GamePhase>([
  'combat_start',
  'player_spin',
  'resolving',
  'enemy_action',
  'turn_end',
])

type PersistedGameState = Partial<GameState> & {
  meta?: Partial<MetaProgress>
}

function isPersistedGameState(value: unknown): value is PersistedGameState {
  return typeof value === 'object' && value !== null
}

function normalizePersistedPhase(
  phase: GamePhase | 'initial_shop',
  player: Player | null,
  currentEnemy: Enemy | null,
  lastCombatReward: CombatReward | null,
): GamePhase {
  if (!player) {
    if (
      phase === 'settings'
      || phase === 'leaderboard'
      || phase === 'modifiers'
      || phase === 'meta_menu'
    ) {
      return phase
    }

    return 'meta_menu'
  }

  if (phase !== 'initial_shop' && RESUMABLE_COMBAT_PHASES.has(phase)) {
    return currentEnemy ? 'combat_start' : 'world_map'
  }

  if (phase === 'post_combat') {
    return lastCombatReward ? 'post_combat' : 'shop'
  }

  if (phase === 'initial_shop' || phase === 'start_symbols') {
    return 'start_symbols'
  }

  if (phase === 'world_map' || phase === 'shop') {
    return phase
  }

  if (phase === 'game_over' || phase === 'run_complete') {
    return phase
  }

  return phase
}

function pickRewardSymbols(enemy: Enemy, player: Player, unlockedSymbolIds: string[]) {
  const symbolCounts = new Map<string, number>()

  for (const reel of player.reels) {
    for (const weightedSymbol of reel.symbolPool) {
      symbolCounts.set(
        weightedSymbol.symbol.id,
        (symbolCounts.get(weightedSymbol.symbol.id) ?? 0) + 1,
      )
    }
  }

  const pool = ALL_SYMBOLS
    .filter((symbol) => unlockedSymbolIds.includes(symbol.id))
    .sort((left, right) => {
      const ownedDelta = (symbolCounts.get(left.id) ?? 0) - (symbolCounts.get(right.id) ?? 0)
      return ownedDelta !== 0 ? ownedDelta : left.id.localeCompare(right.id)
    })

  if (pool.length <= SYMBOL_REWARD_COUNT) {
    return pool
  }

  const picks: GameSymbol[] = []
  let seed = hashString(`${enemy.id}:${enemy.zone}:${player.fightsWon}:${player.tokens}:${player.hp}`)

  while (pool.length > 0 && picks.length < SYMBOL_REWARD_COUNT) {
    seed = nextSeed(seed)
    const candidateWindow = Math.min(pool.length, Math.max(3, Math.ceil(pool.length / 2)))
    const index = seed % candidateWindow
    picks.push(pool.splice(index, 1)[0])
  }

  return picks
}

function buildSupportReward(enemy: Enemy, player: Player): CombatRewardOption {
  const missingHp = Math.max(0, player.maxHp - player.hp)

  if (missingHp > 0) {
    return {
      id: `support-heal-${enemy.id}`,
      type: 'heal',
      amount: Math.min(
        missingHp,
        Math.max(BALANCE.HEAL_POTION_AMOUNT, Math.round(player.maxHp * 0.28)),
      ),
    }
  }

  return {
    id: `support-tokens-${enemy.id}`,
    type: 'tokens',
    amount: BONUS_TOKEN_REWARD_BY_ZONE[enemy.zone],
  }
}

function buildCombatReward(
  enemy: Enemy,
  combatLog: string[],
  player: Player,
  unlockedSymbolIds: string[],
  newUnlocks: GameSymbol[],
): CombatReward {
  const symbolOptions = pickRewardSymbols(enemy, player, unlockedSymbolIds).map((symbol, index) => ({
    id: `symbol-${index}-${symbol.id}`,
    type: 'symbol' as const,
    symbol,
  }))

  return {
    enemyId: enemy.id,
    enemyName: enemy.name,
    enemyIcon: enemy.icon,
    zone: enemy.zone,
    tokenReward: TOKEN_REWARD_BY_ZONE[enemy.zone],
    chipReward: enemy.isBoss ? BOSS_CHIPS_REWARD : 0,
    isBoss: enemy.isBoss,
    combatLog,
    options: [...symbolOptions, buildSupportReward(enemy, player)],
    newUnlocks,
  }
}

interface GameStore extends GameState {
  // ── Phase transitions ──────────────────────────────────
  setPhase: (phase: GamePhase) => void

  // ── Run lifecycle ──────────────────────────────────────
  startRun: () => void
  endRun: (won: boolean) => void
  resetGame: () => void

  // ── Player mutations ───────────────────────────────────
  setPlayer: (player: Player) => void
  resetPlayerArmor: () => void
  applySpinResult: (result: SpinResult) => void

  // ── Enemy mutations ────────────────────────────────────
  setEnemy: (enemy: Enemy) => void
  applyDamageToEnemy: (damage: number) => void
  advanceEnemyPattern: () => void
  recordCombatVictory: (enemy: Enemy, combatLog: string[]) => void

  // ── Player mutations ───────────────────────────────────
  damagePlayer: (amount: number, type: 'physical' | 'magical' | 'debuff') => void

  // ── Spin result ────────────────────────────────────────
  setSpinResult: (result: SpinResult) => void
  claimCombatRewardOption: (optionId: string) => void
  clearCombatReward: () => void

  // ── Start Symbols ─────────────────────────────────────
  setReelsFromSelection: (selected: GameSymbol[]) => void

  // ── Shop (mid-run) ─────────────────────────────────────
  addSymbolToReel: (symbol: GameSymbol, reelIndex: number) => void
  removeSymbolFromReel: (symbolId: string, reelIndex: number) => void

  // ── Meta ───────────────────────────────────────────────
  addChips: (amount: number) => void
  setLanguage: (lang: 'en' | 'ru') => void
  toggleMute: () => void
  toggleHaptics: () => void

  // ── WorldMap ─────────────────────────────────────────
  generateMap: () => void
  setCurrentNode: (nodeId: string) => void

  // ── MetaMenu ────────────────────────────────────────
  applyMetaAllocation: (
    allocated: Array<{ modifierId: ModifierId; count: number }>,
    remainingChips: number
  ) => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      setPhase: (phase) => set({ phase }),

  startRun: () => {
    const meta = get().meta
    const hpBonus = meta.allocatedModifiers
      .filter((m) => m.modifierId === 'health_core')
      .reduce((sum, m) => sum + m.count * 20, 0)
    const reelBonus = meta.allocatedModifiers
      .filter((m) => m.modifierId === 'reel_slot')
      .reduce((sum, m) => sum + m.count, 0)
    const reels = buildStarterReels(Math.min(CONFIG.MAX_REELS, 3 + reelBonus))
    const map = generateWorldMap(Date.now())

    set({
      player: {
        ...DEFAULT_PLAYER,
        maxHp: 100 + hpBonus,
        hp: 100 + hpBonus,
        reels,
        metaModifiers: meta.allocatedModifiers.flatMap((allocation) => (
          Array.from({ length: allocation.count }, () => ({
            id: allocation.modifierId,
            name: allocation.modifierId,
            description: '',
            chipsCost: 0,
          }))
        )),
        tokens: 0,
      },
      phase: 'start_symbols',
      currentZone: 'swamp',
      worldTier: 0,
      currentEnemy: null,
      lastSpinResult: null,
      lastCombatReward: null,
      mapNodes: map,
      currentNodeId: null,
    })
  },

  endRun: (won) => {
    if (won) haptics.notifySuccess()
    else haptics.notifyError()

    set({
      phase: won ? 'run_complete' : 'game_over',
      lastCombatReward: null,
    })
  },

  resetGame: () => {
    const meta = get().meta
    set({
      ...INITIAL,
      meta: { ...meta },
    })
  },

  setPlayer: (player) => set({ player }),
  resetPlayerArmor: () =>
    set((s) => {
      if (!s.player) return s

      return {
        player: {
          ...s.player,
          armor: 0,
        },
      }
    }),

  applySpinResult: (result) =>
    set((s) => {
      if (!s.player) return s
      const p = s.player
      return {
        player: {
          ...p,
          armor: p.armor + result.totalArmor,
          hp: Math.min(p.maxHp, p.hp + result.totalHeal),
          tokens: p.tokens + result.totalTokens,
        },
        lastSpinResult: result,
      }
    }),

  setEnemy: (enemy) => set({
    currentEnemy: enemy,
    lastCombatReward: null,
    lastSpinResult: null,
  }),

  applyDamageToEnemy: (damage) =>
    set((s) => {
      if (!s.currentEnemy) return s
      return {
        currentEnemy: {
          ...s.currentEnemy,
          hp: Math.max(0, s.currentEnemy.hp - damage),
        },
      }
    }),

  advanceEnemyPattern: () =>
    set((s) => {
      if (!s.currentEnemy) return s
      const { currentEnemy: e } = s
      return {
        currentEnemy: {
          ...e,
          patternIndex: (e.patternIndex + 1) % e.attackPattern.length,
        },
      }
    }),

  recordCombatVictory: (enemy, combatLog) =>
    set((s) => {
      if (!s.player) return s
      const nextFightsWon = s.player.fightsWon + 1
      const unlockedBefore = new Set(s.meta.unlockedSymbolIds)
      const unlockedStarterBefore = new Set(s.meta.unlockedStarterSymbolIds)
      const newUnlockIds = SYMBOL_UNLOCK_MILESTONES
        .filter(({ fightsWon, symbolId }) => nextFightsWon >= fightsWon && !unlockedBefore.has(symbolId))
        .map(({ symbolId }) => symbolId)
      const newStarterUnlockIds = STARTER_SYMBOL_UNLOCK_MILESTONES
        .filter(({ fightsWon, symbolId }) => nextFightsWon >= fightsWon && !unlockedStarterBefore.has(symbolId))
        .map(({ symbolId }) => symbolId)
      const nextUnlockedSymbolIds = [...s.meta.unlockedSymbolIds, ...newUnlockIds]
      const nextUnlockedStarterSymbolIds = [...s.meta.unlockedStarterSymbolIds, ...newStarterUnlockIds]
      const newUnlockIdSet = new Set<string>(newUnlockIds)
      const newUnlocks = ALL_SYMBOLS.filter((symbol) => newUnlockIdSet.has(symbol.id))
      const combatReward = buildCombatReward(
        enemy,
        combatLog,
        { ...s.player, fightsWon: nextFightsWon },
        nextUnlockedSymbolIds,
        newUnlocks,
      )

      return {
        player: {
          ...s.player,
          tokens: s.player.tokens + combatReward.tokenReward,
          fightsWon: nextFightsWon,
        },
        meta: {
          ...s.meta,
          totalChips: enemy.isBoss ? s.meta.totalChips + BOSS_CHIPS_REWARD : s.meta.totalChips,
          unlockedSymbolIds: nextUnlockedSymbolIds,
          unlockedStarterSymbolIds: nextUnlockedStarterSymbolIds,
        },
        currentEnemy: null,
        lastCombatReward: enemy.isBoss ? null : combatReward,
      }
    }),

  damagePlayer: (amount, type) => {
    haptics.notifyError()
    set((s) => {
      if (!s.player) return s
      const p = s.player
      const bypassArmor = type === 'debuff'
      const absorbedByArmor = bypassArmor ? 0 : Math.min(p.armor, amount)
      const effective = Math.max(0, amount - absorbedByArmor)

      return {
        player: {
          ...p,
          hp: Math.max(0, p.hp - effective),
          armor: bypassArmor ? p.armor : Math.max(0, p.armor - amount),
        },
      }
    })
  },

  setSpinResult: (result) => set({ lastSpinResult: result }),
  claimCombatRewardOption: (optionId) =>
    set((s) => {
      if (!s.player || !s.lastCombatReward) return s

      const selectedOption = s.lastCombatReward.options.find((option) => option.id === optionId)
      if (!selectedOption) return s

      let nextPlayer = s.player

      if (selectedOption.type === 'symbol') {
        const rewardSymbol = selectedOption.symbol
        if (!rewardSymbol) return s

        const targetReelIndex = s.player.reels.reduce((minIndex, reel, index, reels) => (
          reel.symbolPool.length < reels[minIndex].symbolPool.length ? index : minIndex
        ), 0)

        nextPlayer = {
          ...s.player,
          reels: s.player.reels.map((reel, index) => (
            index === targetReelIndex
              ? {
                  ...reel,
                  symbolPool: [...reel.symbolPool, { symbol: rewardSymbol, weight: 10 }],
                }
              : reel
          )),
        }
      }

      if (selectedOption.type === 'heal') {
        nextPlayer = {
          ...nextPlayer,
          hp: Math.min(nextPlayer.maxHp, nextPlayer.hp + (selectedOption.amount ?? 0)),
        }
      }

      if (selectedOption.type === 'tokens') {
        nextPlayer = {
          ...nextPlayer,
          tokens: nextPlayer.tokens + (selectedOption.amount ?? 0),
        }
      }

      return {
        player: nextPlayer,
        lastCombatReward: null,
        phase: 'shop',
      }
    }),
  clearCombatReward: () => set({ lastCombatReward: null }),

  // Every selected starting symbol is added to every reel so it can appear
  // across the full slot, not only on a single lane.
  setReelsFromSelection: (selected: GameSymbol[]) =>
    set((s) => {
      if (!s.player) return s
      const reelCount = s.player.reels.length
      const reels = Array.from({ length: reelCount }, (_, i) => ({
        id: `reel_${i + 1}`,
        symbolPool: selected.map((sym) => ({ symbol: sym, weight: 10 })),
      }))

      return { player: { ...s.player, reels } }
    }),

  addSymbolToReel: (symbol, reelIndex) =>
    set((s) => {
      if (!s.player) return s
      const reels = s.player.reels.map((r, i) =>
        i === reelIndex
          ? { ...r, symbolPool: [...r.symbolPool, { symbol, weight: 10 }] }
          : r
      )
      return { player: { ...s.player, reels } }
    }),

  removeSymbolFromReel: (symbolId, reelIndex) =>
    set((s) => {
      if (!s.player) return s
      const reels = s.player.reels.map((r, i) =>
        i === reelIndex
          ? { ...r, symbolPool: r.symbolPool.filter((ws) => ws.symbol.id !== symbolId) }
          : r
      )
      return { player: { ...s.player, reels } }
    }),

  addChips: (amount) =>
    set((s) => ({
      meta: { ...s.meta, totalChips: s.meta.totalChips + amount },
    })),

  setLanguage: (lang) =>
    set((s) => ({
      meta: { ...s.meta, language: lang },
    })),

  toggleMute: () =>
    set((s) => ({
      meta: { ...s.meta, isMuted: !s.meta.isMuted },
    })),

  toggleHaptics: () =>
    set((s) => ({
      meta: {
        ...s.meta,
        isHapticsEnabled: s.meta.isHapticsEnabled !== false ? false : true,
      },
    })),

  generateMap: () =>
    set((s) => ({
      mapNodes: generateWorldMap(Date.now() + s.worldTier * 9973),
      currentNodeId: null,
      currentZone: 'swamp',
    })),

  setCurrentNode: (nodeId) =>
    set((s) => ({
      currentNodeId: nodeId,
      currentZone: s.mapNodes.find((n) => n.id === nodeId)?.zone ?? s.currentZone,
      mapNodes: s.mapNodes.map((n) =>
        n.id === nodeId ? { ...n, visited: true } : n
      ),
    })),

  applyMetaAllocation: (allocated, remainingChips) =>
    set((s) => ({
      meta: {
        ...s.meta,
        allocatedModifiers: allocated,
        totalChips: remainingChips,
      },
    })),
    }),
    {
      name: 'tgds-meta-storage',
      partialize: (state) => ({
        phase: normalizePersistedPhase(
          state.phase,
          state.player,
          state.currentEnemy,
          state.lastCombatReward,
        ),
        currentZone: state.currentZone,
        worldTier: state.worldTier,
        player: state.player,
        currentEnemy: state.currentEnemy,
        mapNodes: state.mapNodes,
        currentNodeId: state.currentNodeId,
        lastSpinResult: state.lastSpinResult,
        lastCombatReward: state.lastCombatReward,
        meta: state.meta,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameState> | undefined
        const player = persisted?.player ?? currentState.player
        const currentEnemy = player ? (persisted?.currentEnemy ?? currentState.currentEnemy) : null
        const lastCombatReward = persisted?.lastCombatReward ?? currentState.lastCombatReward

        return {
          ...currentState,
          ...persisted,
          currentEnemy,
          lastCombatReward,
          phase: normalizePersistedPhase(
            persisted?.phase ?? currentState.phase,
            player,
            currentEnemy,
            lastCombatReward,
          ),
        }
      },
      version: 7,
      migrate: (persistedState: unknown, version: number) => {
        if (!isPersistedGameState(persistedState)) {
          return persistedState
        }

        // v0 -> v2: give all existing players 100 starting chips
        if (version < 2 && persistedState?.meta) {
          persistedState.meta.totalChips = Math.max(
            persistedState.meta.totalChips ?? 0,
            100
          )
        }
        if (persistedState?.meta && version < 3) {
          persistedState.meta.isHapticsEnabled = persistedState.meta.isHapticsEnabled ?? true
        }
        if (persistedState && version < 5) {
          persistedState.phase = normalizePersistedPhase(
            persistedState.phase ?? INITIAL.phase,
            persistedState.player ?? null,
            persistedState.currentEnemy ?? null,
            persistedState.lastCombatReward ?? null,
          )
        }
        if (persistedState && version < 6) {
          const reward = persistedState.lastCombatReward as Partial<CombatReward> | null | undefined
          if (reward && !Array.isArray(reward.options)) {
            persistedState.lastCombatReward = null
            if (persistedState.phase === 'post_combat') {
              persistedState.phase = 'shop'
            }
          }
        }
        if (persistedState?.meta && version < 7) {
          persistedState.meta.unlockedStarterSymbolIds =
            persistedState.meta.unlockedStarterSymbolIds && persistedState.meta.unlockedStarterSymbolIds.length > 0
              ? persistedState.meta.unlockedStarterSymbolIds
              : [...BASE_STARTER_SYMBOL_IDS]
        }
        const persistedPhase = persistedState?.phase as GamePhase | 'initial_shop' | undefined
        if (persistedPhase === 'initial_shop' && version < 7) {
          persistedState.phase = 'start_symbols'
        }
        return persistedState
      },
    }
  )
)
