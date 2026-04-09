import { symbolIconById } from '@/assets/pixelArt'
import type { GameSymbol, Reel } from '@/types'

// Symbol definitions
// Damage comes ONLY from symbols - NO player.attack

export const BASE_STARTER_SYMBOL_IDS = ['dagger', 'shield', 'coin'] as const

const DAGGER: GameSymbol = {
  id: 'dagger',
  name: 'Dagger',
  icon: symbolIconById.dagger,
  type: 'damage',
  rarity: 'common',
  level: 1,
  tags: ['weapon'],
  effect: { damage: 12 },
}

const SHIELD_SYM: GameSymbol = {
  id: 'shield',
  name: 'Shield',
  icon: symbolIconById.shield,
  type: 'defense',
  rarity: 'common',
  level: 1,
  tags: ['shield'],
  effect: { armor: 20 },
}

const COIN: GameSymbol = {
  id: 'coin',
  name: 'Coin',
  icon: symbolIconById.coin,
  type: 'economy',
  rarity: 'common',
  level: 1,
  tags: ['coin'],
  effect: { tokens: 5 },
}

const ENERGIZER: GameSymbol = {
  id: 'energizer',
  name: 'Energizer',
  icon: symbolIconById.energizer,
  type: 'damage',
  rarity: 'rare',
  level: 1,
  tags: ['magic'],
  effect: { magicDamage: 15 },
}

/**
 * Bomb — run-persistent scaling symbol
 * Base damage = 10. Each spin with Bomb accumulates +1 bombCharge (persists across fights).
 * Total damage = baseDamage + player.bombCharge × BOMB_PER_CHARGE_DMG (4)
 * After 6 charges: 10 + 6×4 = 34 physical damage.
 */
const BOMB: GameSymbol = {
  id: 'bomb',
  name: 'Bomb',
  icon: symbolIconById.bomb,
  type: 'damage',
  rarity: 'epic',
  level: 1,
  tags: ['explosive'],
  effect: { damage: 10, isBomb: true },
}

/**
 * Axe — armor counter
 * Deals baseAxeDamage + enemy.armor × AXE_ARMOR_MULT (1.5) physical damage.
 * The more armor the enemy has, the harder the Axe hits.
 * Against Iron Golem (armor 20): 8 + 20×1.5 = 38 physical damage.
 */
const AXE: GameSymbol = {
  id: 'axe',
  name: 'Axe',
  icon: symbolIconById.dagger,  // Reuse dagger icon until dedicated asset is added
  type: 'damage',
  rarity: 'rare',
  level: 1,
  tags: ['axe', 'weapon'],
  effect: { damage: 8, isAxe: true },
}

/**
 * Diamond — post-stop reroll
 * After all reels are stopped, Diamond rerolls the reel immediately to its right
 * if that reel's timing is not 'perfect'. The rerolled reel gets a new random
 * symbol from the player's inventory and 'ok' timing.
 * Effectively gives a second chance on poor stops.
 */
const DIAMOND: GameSymbol = {
  id: 'diamond',
  name: 'Diamond',
  icon: symbolIconById.diamond,
  type: 'special',
  rarity: 'epic',
  level: 1,
  tags: ['diamond'],
  effect: { tokens: 5 },
}

const POISON_VIAL: GameSymbol = {
  id: 'poison_vial',
  name: 'Poison Vial',
  icon: symbolIconById.poison_vial,
  type: 'special',
  rarity: 'rare',
  level: 1,
  tags: ['poison', 'magic'],
  effect: { poisonStacks: 2 },  // 2 stacks × 3 dmg/turn = 6 DoT, ignores armor
}

const MAGIC_SCROLL: GameSymbol = {
  id: 'magic_scroll',
  name: 'Magic Scroll',
  icon: symbolIconById.magic_scroll,
  type: 'special',
  rarity: 'rare',
  level: 1,
  tags: ['magic'],
  effect: { magicDamage: 12 },
}

const HEALTH_POTION: GameSymbol = {
  id: 'health_potion',
  name: 'Health Potion',
  icon: symbolIconById.health_potion,
  type: 'special',
  rarity: 'common',
  level: 1,
  tags: ['heal', 'magic'],
  effect: { heal: 15 },
}

/**
 * Sawblade — guaranteed crit enabler
 * After all reels stop, Sawblade forces both neighboring reels (left and right)
 * to 'perfect' timing. The symbols remain the same but get full damage multiplier (×2).
 * Sawblade itself deals no damage — it's a pure combat utility.
 */
const SAWBLADE: GameSymbol = {
  id: 'sawblade',
  name: 'Sawblade',
  icon: symbolIconById.energizer,  // Reuse energizer icon until dedicated asset
  type: 'special',
  rarity: 'epic',
  level: 1,
  tags: ['sawblade'],
  effect: { isSawblade: true },
}

export const ALL_SYMBOLS: GameSymbol[] = [
  DAGGER,
  SHIELD_SYM,
  COIN,
  ENERGIZER,
  BOMB,
  DIAMOND,
  POISON_VIAL,
  MAGIC_SCROLL,
  HEALTH_POTION,
  AXE,
  SAWBLADE,
]

export const STARTER_REELS: Reel[] = [
  { id: 'reel_1' },
  { id: 'reel_2' },
  { id: 'reel_3' },
]
