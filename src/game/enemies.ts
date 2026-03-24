import type { Enemy, ZoneType } from '@/types'

// ── Enemy library ─────────────────────────────────────────
// Each enemy has a deterministic attackPattern (cycles, not random)

// ── SWAMP ZONE ────────────────────────────────────────────
export const SWAMP_ENEMIES: Enemy[] = [
  {
    id: 'bog_slime',
    name: 'Bog Slime',
    icon: '🟢',
    zone: 'swamp',
    hp: 40,
    maxHp: 40,
    attackPattern: [
      { damage: 8, type: 'magical', description: 'Acid splash' },
      { damage: 5, type: 'debuff',  description: 'Poison coat' },
    ],
    patternIndex: 0,
    statusEffects: [],
    blockedReels: [],
    isBoss: false,
  },
  {
    id: 'swamp_witch',
    name: 'Swamp Witch',
    icon: '🧙',
    zone: 'swamp',
    hp: 55,
    maxHp: 55,
    attackPattern: [
      { damage: 10, type: 'magical', description: 'Hex bolt' },
      { damage: 6,  type: 'physical', description: 'Staff jab' },
      { damage: 12, type: 'magical', description: 'Poison nova' },
    ],
    patternIndex: 0,
    statusEffects: [],
    blockedReels: [],
    isBoss: false,
  },
  {
    id: 'vine_horror',
    name: 'Vine Horror',
    icon: '🌿',
    zone: 'swamp',
    hp: 90,
    maxHp: 90,
    attackPattern: [
      { damage: 14, type: 'physical', description: 'Vine whip' },
      { damage: 8,  type: 'physical', description: 'Thorn strike' },
      { damage: 0,  type: 'debuff',  description: 'Root — stagger' },
      { damage: 18, type: 'physical', description: 'Crush' },
    ],
    patternIndex: 0,
    statusEffects: [],
    blockedReels: [],
    isBoss: true,
  },
]

// ── SEWER ZONE ────────────────────────────────────────────
export const SEWER_ENEMIES: Enemy[] = [
  {
    id: 'hammer_goblin',
    name: 'Hammer Goblin',
    icon: '👺',
    zone: 'sewer',
    hp: 60,
    maxHp: 60,
    attackPattern: [
      { damage: 12, type: 'physical', description: 'Hammer swing' },
      { damage: 8,  type: 'physical', description: 'Quick jab' },
      { damage: 10, type: 'magical',  description: 'Poison spit' },
    ],
    patternIndex: 0,
    statusEffects: [],
    blockedReels: [],
    isBoss: false,
  },
  {
    id: 'sewer_rat_king',
    name: 'Rat King',
    icon: '🐀',
    zone: 'sewer',
    hp: 50,
    maxHp: 50,
    attackPattern: [
      { damage: 7,  type: 'physical', description: 'Bite frenzy' },
      { damage: 7,  type: 'physical', description: 'Bite frenzy' },
      { damage: 5,  type: 'debuff',  description: 'Disease' },
    ],
    patternIndex: 0,
    statusEffects: [],
    blockedReels: [],
    isBoss: false,
  },
  {
    id: 'iron_golem',
    name: 'Iron Golem',
    icon: '🤖',
    zone: 'sewer',
    hp: 130,
    maxHp: 130,
    attackPattern: [
      { damage: 20, type: 'physical', description: 'Slam' },
      { damage: 10, type: 'physical', description: 'Shockwave' },
      { damage: 0,  type: 'debuff',  description: 'Block Reel 1' },
      { damage: 25, type: 'physical', description: 'Overcharge crush' },
    ],
    patternIndex: 0,
    statusEffects: [],
    blockedReels: [],
    isBoss: true,
  },
]

// ── CITADEL ZONE ─────────────────────────────────────────
export const CITADEL_ENEMIES: Enemy[] = [
  {
    id: 'shadow_knight',
    name: 'Shadow Knight',
    icon: '🗡️',
    zone: 'citadel',
    hp: 80,
    maxHp: 80,
    attackPattern: [
      { damage: 18, type: 'physical', description: 'Dark slash' },
      { damage: 12, type: 'magical',  description: 'Soul drain' },
    ],
    patternIndex: 0,
    statusEffects: [],
    blockedReels: [],
    isBoss: false,
  },
  {
    id: 'lich',
    name: 'Lich',
    icon: '💀',
    zone: 'citadel',
    hp: 70,
    maxHp: 70,
    attackPattern: [
      { damage: 15, type: 'magical',  description: 'Frost bolt' },
      { damage: 0,  type: 'debuff',  description: 'Freeze — miss auto' },
      { damage: 20, type: 'magical',  description: 'Death coil' },
    ],
    patternIndex: 0,
    statusEffects: [],
    blockedReels: [],
    isBoss: false,
  },
  {
    id: 'dark_overlord',
    name: 'Dark Overlord',
    icon: '👑',
    zone: 'citadel',
    hp: 180,
    maxHp: 180,
    attackPattern: [
      { damage: 22, type: 'physical', description: 'Void strike' },
      { damage: 18, type: 'magical',  description: 'Soul burst' },
      { damage: 0,  type: 'debuff',  description: 'Block 2 reels' },
      { damage: 30, type: 'magical',  description: 'Apocalypse' },
    ],
    patternIndex: 0,
    statusEffects: [],
    blockedReels: [],
    isBoss: true,
  },
]

const ALL_ENEMIES = [...SWAMP_ENEMIES, ...SEWER_ENEMIES, ...CITADEL_ENEMIES]

export function getRandomEnemy(zone: ZoneType, bossOnly = false): Enemy {
  const pool = zone === 'swamp' ? SWAMP_ENEMIES
    : zone === 'sewer' ? SEWER_ENEMIES : CITADEL_ENEMIES
  const filtered = bossOnly ? pool.filter((e) => e.isBoss) : pool.filter((e) => !e.isBoss)
  const enemy = filtered[Math.floor(Math.random() * filtered.length)]
  // Return fresh copy with reset patternIndex
  return { ...enemy, patternIndex: 0, hp: enemy.maxHp }
}

export { ALL_ENEMIES }
