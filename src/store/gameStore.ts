import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, GamePhase, Player, Enemy, SpinResult, MetaProgress, GameSymbol } from '@/types'
import type { ModifierId } from '@/types'
import { STARTER_REELS } from '@/game/symbols'
import { generateWorldMap } from '@/game/worldMap'
import { haptics } from '@/utils/haptics'

const DEFAULT_META: MetaProgress = {
  totalChips: 100, // Starting chips so modifiers are immediately usable
  unlockedSymbolIds: ['dagger', 'shield', 'coin', 'energizer', 'bomb', 'diamond'],
  allocatedModifiers: [],
  language: 'ru', // Default language
  isMuted: false, // Default sound on
  isHapticsEnabled: true,
}

const BOSS_CHIPS_REWARD = 20

const DEFAULT_PLAYER: Player = {
  hp: 100,
  maxHp: 100,
  armor: 0,
  reels: STARTER_REELS,
  relics: [],
  tokens: 0,
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
  meta: DEFAULT_META,
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
  resetArmor: () => void          // called at start of PLAYER_SPIN_PHASE
  applySpinResult: (result: SpinResult) => void

  // ── Enemy mutations ────────────────────────────────────
  setEnemy: (enemy: Enemy) => void
  applyDamageToEnemy: (damage: number) => void
  advanceEnemyPattern: () => void
  recordCombatVictory: (enemy: Enemy) => void

  // ── Player mutations ───────────────────────────────────
  damagePlayer: (amount: number, type: 'physical' | 'magical') => void

  // ── Spin result ────────────────────────────────────────
  setSpinResult: (result: SpinResult) => void

  // ── InitialShop ────────────────────────────────────────
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
    const reels = STARTER_REELS.slice(0, Math.min(5, 3 + reelBonus))
    const map = generateWorldMap(Date.now())

    set({
      player: {
        ...DEFAULT_PLAYER,
        maxHp: 100 + hpBonus,
        hp: 100 + hpBonus,
        reels,
        metaModifiers: meta.allocatedModifiers.map((a) => ({
          id: a.modifierId,
          name: a.modifierId,
          description: '',
          chipsCost: 0,
        })),
        tokens: 30, // Starting balance for the initial shop
      },
      phase: 'initial_shop',
      currentZone: 'swamp',
      worldTier: 0,
      currentEnemy: null,
      lastSpinResult: null,
      mapNodes: map,
      currentNodeId: null,
    })
  },

  endRun: (won) => {
    if (won) haptics.notifySuccess()
    else haptics.notifyError()

    const chipsEarned = won ? 30 : 10
    set((s) => ({
      meta: { ...s.meta, totalChips: s.meta.totalChips + chipsEarned },
      phase: won ? 'run_complete' : 'game_over',
    }))
  },

  resetGame: () => set(INITIAL),

  setPlayer: (player) => set({ player }),

  // Armor resets at start of PLAYER_SPIN_PHASE (not combat start)
  resetArmor: () =>
    set((s) => ({
      player: s.player ? { ...s.player, armor: 0 } : null,
    })),

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

  setEnemy: (enemy) => set({ currentEnemy: enemy }),

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

  recordCombatVictory: (enemy) =>
    set((s) => {
      if (!s.player) return s

      const nextWorldTier = enemy.isBoss ? s.worldTier + 1 : s.worldTier
      const nextMap = enemy.isBoss
        ? generateWorldMap(Date.now() + nextWorldTier * 9973)
        : s.mapNodes

      return {
        player: {
          ...s.player,
          fightsWon: s.player.fightsWon + 1,
        },
        meta: enemy.isBoss
          ? { ...s.meta, totalChips: s.meta.totalChips + BOSS_CHIPS_REWARD }
          : s.meta,
        currentEnemy: null,
        currentZone: enemy.isBoss ? 'swamp' : s.currentZone,
        worldTier: nextWorldTier,
        mapNodes: nextMap,
        currentNodeId: enemy.isBoss ? null : s.currentNodeId,
      }
    }),

  damagePlayer: (amount, type) => {
    haptics.notifyError()
    set((s) => {
      if (!s.player) return s
      const p = s.player
      const effective =
        type === 'magical'
          ? amount
          : Math.max(0, amount - p.armor)
      return {
        player: {
          ...p,
          hp: Math.max(0, p.hp - effective),
          // Armor consumed by physical hits
          armor: type === 'physical' ? Math.max(0, p.armor - amount) : p.armor,
        },
      }
    })
  },

  setSpinResult: (result) => set({ lastSpinResult: result }),

  // Distribute selected symbols across reels (round-robin)
  // Each symbol gets a weight of 10; equal probability
  setReelsFromSelection: (selected: GameSymbol[]) =>
    set((s) => {
      if (!s.player) return s
      const reelCount = s.player.reels.length
      const reels = Array.from({ length: reelCount }, (_, i) => ({
        id: `reel_${i + 1}`,
        symbolPool: selected
          .filter((_, idx) => idx % reelCount === i || selected.length < reelCount)
          .concat(
            // If fewer symbols than reels, give every reel the full pool
            selected.length < reelCount ? selected : []
          )
          .map((sym) => ({ symbol: sym, weight: 10 })),
      }))
      // Fallback: every reel gets full pool if pool is tiny
      const safeReels = reels.map((r) =>
        r.symbolPool.length === 0
          ? { ...r, symbolPool: selected.map((sym) => ({ symbol: sym, weight: 10 })) }
          : r
      )
      return { player: { ...s.player, reels: safeReels } }
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
      partialize: (state) => ({ meta: state.meta }),
      version: 3,
      migrate: (persistedState: any, version: number) => {
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
        return persistedState
      },
    }
  )
)
