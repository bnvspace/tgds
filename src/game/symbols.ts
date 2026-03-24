import type { GameSymbol, WeightedSymbol, Reel } from '@/types'

// ── Symbol definitions ────────────────────────────────────
// Damage comes ONLY from symbols — NO player.attack

const DAGGER: GameSymbol = {
  id: 'dagger',
  name: 'Dagger',
  icon: '🗡️',
  type: 'damage',
  rarity: 'common',
  level: 1,
  tags: ['weapon'],
  effect: { damage: 12 },
}

const SHIELD_SYM: GameSymbol = {
  id: 'shield',
  name: 'Shield',
  icon: '🛡️',
  type: 'defense',
  rarity: 'common',
  level: 1,
  tags: ['shield'],
  effect: { armor: 20 },
}

const COIN: GameSymbol = {
  id: 'coin',
  name: 'Coin',
  icon: '🪙',
  type: 'economy',
  rarity: 'common',
  level: 1,
  tags: ['coin'],
  effect: { tokens: 5 },
}

const ENERGIZER: GameSymbol = {
  id: 'energizer',
  name: 'Energizer',
  icon: '⚡',
  type: 'damage',
  rarity: 'rare',
  level: 1,
  tags: ['magic'],
  effect: { magicDamage: 15 }, // bypasses enemy armor
}

const BOMB: GameSymbol = {
  id: 'bomb',
  name: 'Bomb',
  icon: '💣',
  type: 'damage',
  rarity: 'epic',
  level: 1,
  tags: ['explosive'],
  effect: { damage: 25 },
}

const DIAMOND: GameSymbol = {
  id: 'diamond',
  name: 'Diamond',
  icon: '💎',
  type: 'special',
  rarity: 'epic',
  level: 1,
  tags: ['diamond'],
  effect: { tokens: 8, damage: 5 },
}

// All available symbols (Initial Shop pool)
export const ALL_SYMBOLS: GameSymbol[] = [
  DAGGER, SHIELD_SYM, COIN, ENERGIZER, BOMB, DIAMOND,
]

// Starter reels (3 reels, common-weighted)
export const STARTER_REELS: Reel[] = [
  {
    id: 'reel_1',
    symbolPool: makeWeighted([
      { symbol: DAGGER, weight: 60 },
      { symbol: SHIELD_SYM, weight: 30 },
      { symbol: COIN, weight: 10 },
    ]),
  },
  {
    id: 'reel_2',
    symbolPool: makeWeighted([
      { symbol: SHIELD_SYM, weight: 50 },
      { symbol: DAGGER, weight: 30 },
      { symbol: COIN, weight: 20 },
    ]),
  },
  {
    id: 'reel_3',
    symbolPool: makeWeighted([
      { symbol: COIN, weight: 50 },
      { symbol: DAGGER, weight: 30 },
      { symbol: SHIELD_SYM, weight: 20 },
    ]),
  },
]

function makeWeighted(
  entries: Array<{ symbol: GameSymbol; weight: number }>
): WeightedSymbol[] {
  return entries
}
