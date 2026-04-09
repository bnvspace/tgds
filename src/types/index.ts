// ============================================
// Core game types — Slot & Daggers TMA
// VERIFIED GAME DESIGN SPEC
// D_total = (Σ D_base · L_mod · S_syn · R_mod) · M_qte
// NO player.attack — damage comes ONLY from symbols
// ============================================

// ── Game phases ──────────────────────────────────────────
export type GamePhase =
  | 'meta_menu'         // main menu + microchip modifiers (free respec)
  | 'settings'          // app settings: language / audio / haptics
  | 'start_symbols'     // FIRST PHASE: choose exactly 3 starting symbols
  | 'world_map'         // SELECT_NODE (Swamp / Sewer / Citadel, no backtrack)
  | 'combat_start'      // init Enemy
  | 'player_spin'       // PLAYER_SPIN_PHASE
  | 'resolving'         // SYMBOL_RESOLUTION (7-step pipeline)
  | 'enemy_action'      // deterministic pattern, shown before spin
  | 'turn_end'          // check win/lose conditions
  | 'post_combat'       // POST_COMBAT_REWARD (tokens + symbol choice + relic + heal)
  | 'shop'              // SHOP (buy/remove/upgrade symbols)
  | 'game_over'
  | 'run_complete'      // FINAL_BOSS_DEFEATED → chips awarded
  | 'leaderboard'       // Global leaderboard screen
  | 'modifiers'         // MetaMenu modifier allocation screen

// ── Symbol types ─────────────────────────────────────────
export type SymbolType = 'damage' | 'defense' | 'economy' | 'special'
export type Rarity = 'common' | 'rare' | 'epic'
export type SymbolTag =
  | 'weapon' | 'magic' | 'explosive'
  | 'coin' | 'shield' | 'diamond' | 'poison' | 'heal'

// ── Zone types ───────────────────────────────────────────
export type ZoneType = 'swamp' | 'sewer' | 'citadel'
export type NodeType = 'combat' | 'elite' | 'shop' | 'heal' | 'boss'

// ── Symbol ───────────────────────────────────────────────
export interface SymbolEffect {
  damage?: number        // physical damage (NOT player.attack)
  magicDamage?: number   // ignores enemy armor
  armor?: number         // added to player.armor this turn
  heal?: number
  tokens?: number
  poisonStacks?: number  // stacks added to enemy; each stack = 3 dmg/turn, ignores armor
  stunTurns?: number     // turns the enemy is stunned (skips enemy action)
}

export interface GameSymbol {
  id: string
  name: string
  icon: string
  type: SymbolType
  rarity: Rarity
  level: number          // 1-3
  tags: SymbolTag[]
  effect: SymbolEffect
}

// ── Reel ─────────────────────────────────────────────────
// Each reel is a physical stop slot. Rolls use the shared player inventory.
export interface WeightedSymbol {
  symbol: GameSymbol
  weight: number         // determines probability
}

export interface Reel {
  id: string
}
// spin = Array.from({ length: reelCount }, () => weightedRandom(player.symbolInventory))

// ── QTE (legacy — kept for migration) ────────────────────
// QTE multiplier applies ONLY to damage. Not armor/gold/heal.
export type QTETier = 'miss' | 'hit' | 'crit' | 'mega_crit'
export const QTE_MULTIPLIERS: Record<QTETier, number> = {
  miss: 1,
  hit: 1.5,
  crit: 2,
  mega_crit: 3,
} as const

export interface QTEResult {
  tier: QTETier
  multiplier: 1 | 1.5 | 2 | 3
}

// ── Timing Skill Check (replaces QTE) ────────────────────
// Evaluated per-reel on manual stop. Multiplier applies ONLY to damage.
export type TimingTier = 'perfect' | 'good' | 'ok'

export interface TimingResult {
  tier: TimingTier
  multiplier: number
  offset: number  // normalized 0..1 distance from ideal
}

// ── Synergy ──────────────────────────────────────────────
// Synergies fire ONLY within current spin. NEVER persistent.
// Tag-based, NOT symbol ID based.
export interface Synergy {
  id: string
  name: string
  description: string
  requiredTags: SymbolTag[]    // must all appear in same spin
  minCount?: number             // min occurrences of each tag
  damageMultiplier?: number     // S_syn applied in step 3
  bonusDamage?: number
  bonusTokens?: number
  bonusArmor?: number
}

export interface MatchGroup {
  symbol: GameSymbol
  count: number
  multiplier: number
}

// ── Symbol Resolution (7-step pipeline) ──────────────────
export interface SpinResult {
  rolledSymbols: GameSymbol[]  // one per reel (NOT a grid!)
  qte: QTEResult               // legacy, kept for log display compat
  timingResults: TimingResult[] // per-reel timing from manual stop
  matchGroups: MatchGroup[]
  // Resolution steps output:
  baseDamage: number           // step 2 — physical
  baseMagicDamage: number      // step 2 — magic
  baseArmor: number
  baseTokens: number
  baseHeal: number
  synergiesActivated: Synergy[] // step 3
  totalDamage: number          // combined for backward compat
  totalPhysicalDamage: number  // blocked by enemy armor
  totalMagicDamage: number     // bypasses enemy armor
  totalArmor: number           // timing does NOT affect this
  totalTokens: number          // timing does NOT affect this
  totalHeal: number            // timing does NOT affect this
  poisonStacksApplied: number  // stacks added to enemy this spin
  stunApplied: boolean         // whether stun was applied this spin
  bestTimingTier: TimingTier | null
}

// ── Enemy ────────────────────────────────────────────────
export type AttackType = 'physical' | 'magical' | 'debuff'
// physical/magical: first remove armor, then HP
// debuff: bypasses armor and hits HP directly

export type StatusEffectType = 'poison' | 'freeze' | 'burn' | 'block_reel'

export interface AttackPattern {
  damage: number
  type: AttackType
  description: string  // shown to player BEFORE spin (telegraphed)
}

export interface ReelBlockEffect {
  reelIndex: number
  duration: number     // turns remaining
  burnDamage?: number  // damage if blocked reel is used
}

export interface StatusEffect {
  type: StatusEffectType
  duration: number
  value: number
}

export interface Enemy {
  id: string
  name: string
  icon: string
  zone: ZoneType
  hp: number
  maxHp: number
  armor: number          // physical damage reduction per hit (NOT cumulative per turn)
  // DETERMINISTIC cycle — patternIndex increments each turn, wraps around
  attackPattern: AttackPattern[]
  patternIndex: number
  statusEffects: StatusEffect[]
  blockedReels: ReelBlockEffect[]
  isBoss: boolean
}

// ── Player ───────────────────────────────────────────────
// NO attack field. Damage ONLY from symbols.
export interface Player {
  hp: number
  maxHp: number
  armor: number         // resets at the start of PLAYER_SPIN_PHASE
  reels: Reel[]
  symbolInventory: WeightedSymbol[]
  relics: Relic[]
  tokens: number
  bombCharge: number
  metaModifiers: Modifier[]
  fightsWon: number     // tracks boss kills for symbol unlocks
}

// ── Relic ────────────────────────────────────────────────
export interface RelicEffect {
  hpBonus?: number
  reelCountBonus?: number      // extra reels
  rarityWeightBonus?: number   // affects rarity weighting
  armorPreservePercent?: number // % armor carried between turns
  tokensBonusPerFight?: number
  damageReduction?: number
}

export interface Relic {
  id: string
  name: string
  icon: string
  description: string
  effect: RelicEffect
}

// ── Meta Progression ─────────────────────────────────────
// Modifiers affect player baseline ONLY. NOT symbol pool directly.
export type ModifierId =
  | 'physical_strength'  // +20% physical dmg / level, 50 chips
  | 'health_core'        // +base HP, 25 chips
  | 'reel_slot'          // +1 reel (3→4→5 max), 100 chips
  | 'token_collector'    // +tokens from Coin symbols, 40 chips

export interface Modifier {
  id: ModifierId
  name: string
  description: string
  chipsCost: number
}

export interface MetaProgress {
  totalChips: number
  unlockedSymbolIds: string[]   // grows as bosses are defeated
  unlockedStarterSymbolIds: string[]
  // Free respec before each run (Refund All)
  allocatedModifiers: Array<{ modifierId: ModifierId; count: number }>
  language?: 'en' | 'ru'
  isMuted?: boolean
  isHapticsEnabled?: boolean
}

// ── World Map ─────────────────────────────────────────────
export interface MapNode {
  id: string
  type: NodeType
  zone: ZoneType
  visited: boolean
  connections: string[]        // forward only, no backtracking
  position: { x: number; y: number }
}

export type CombatRewardOptionType = 'symbol' | 'heal' | 'tokens'

export interface CombatRewardOption {
  id: string
  type: CombatRewardOptionType
  symbol?: GameSymbol
  amount?: number
}

export interface CombatReward {
  enemyId: string
  enemyName: string
  enemyIcon: string
  zone: ZoneType
  tokenReward: number
  chipReward: number
  isBoss: boolean
  combatLog: string[]
  options: CombatRewardOption[]
  newUnlocks: GameSymbol[]
}

// ── Global Game State ─────────────────────────────────────
export interface GameState {
  phase: GamePhase
  currentZone: ZoneType
  worldTier: number
  player: Player | null
  currentEnemy: Enemy | null
  mapNodes: MapNode[]
  currentNodeId: string | null
  lastSpinResult: SpinResult | null
  lastCombatReward: CombatReward | null
  meta: MetaProgress
}
