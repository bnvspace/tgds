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

const BOMB: GameSymbol = {
  id: 'bomb',
  name: 'Bomb',
  icon: symbolIconById.bomb,
  type: 'damage',
  rarity: 'epic',
  level: 1,
  tags: ['explosive'],
  effect: { damage: 25 },
}

const DIAMOND: GameSymbol = {
  id: 'diamond',
  name: 'Diamond',
  icon: symbolIconById.diamond,
  type: 'special',
  rarity: 'epic',
  level: 1,
  tags: ['diamond'],
  effect: { tokens: 8, damage: 5 },
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
]

export const STARTER_REELS: Reel[] = [
  { id: 'reel_1' },
  { id: 'reel_2' },
  { id: 'reel_3' },
]
