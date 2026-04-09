// ============================================
// Game configuration constants
// ============================================

export const CONFIG = {
  GRID_COLS: 7,           // 7 columns per original game
  GRID_ROWS: 5,           // 5 rows (fits mobile screen)
  TOTAL_FLOORS: 5,
  ENEMY_HP_SCALE: 1.2,   // +20% HP per floor
  BOSS_HP_MULTIPLIER: 3,
  UPGRADE_CHOICES: 3,
  START_SYMBOL_COUNT: 3,
  MAX_REELS: 5,
  SPIN_ANIM_MS: 2800,    // total spin animation duration
} as const

export const RARITY_WEIGHTS = {
  common: 60,
  rare: 30,
  epic: 10,
} as const

export const BALANCE = {
  MIN_DAMAGE: 1,
  BASE_XP_PER_KILL: 10,
  BOSS_XP_MULTIPLIER: 5,
  HEAL_POTION_AMOUNT: 20,
  ATTACK_BONUS_AMOUNT: 5,
} as const
