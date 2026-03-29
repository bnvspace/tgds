import type { Enemy, ZoneType } from '@/types'

// ── Enemy library ─────────────────────────────────────────
// Each enemy has a deterministic attackPattern (cycles, not random)
// Enemies are significantly buffed to provide meaningful challenge

// ── SWAMP ZONE ────────────────────────────────────────────
export const SWAMP_ENEMIES: Enemy[] = [
  {
    id: 'bog_slime',
    name: 'Bog Slime',
    icon: '🟢',
    zone: 'swamp',
    hp: 80,
    maxHp: 80,
    attackPattern: [
      { damage: 14, type: 'magical', description: 'Acid splash' },
      { damage: 10, type: 'debuff',  description: 'Poison coat' },
      { damage: 18, type: 'magical', description: 'Corrosive vomit' },
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
    hp: 100,
    maxHp: 100,
    attackPattern: [
      { damage: 16, type: 'magical', description: 'Hex bolt' },
      { damage: 12, type: 'physical', description: 'Staff jab' },
      { damage: 22, type: 'magical', description: 'Poison nova' },
      { damage: 8, type: 'debuff', description: 'Curse — weaken' },
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
    hp: 145,
    maxHp: 145,
    attackPattern: [
      { damage: 16, type: 'physical', description: 'Vine whip' },
      { damage: 12, type: 'physical', description: 'Thorn strike' },
      { damage: 0,  type: 'debuff',  description: 'Root — stagger' },
      { damage: 22, type: 'physical', description: 'Crush' },
      { damage: 10, type: 'magical',  description: 'Spore burst' },
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
    hp: 120,
    maxHp: 120,
    attackPattern: [
      { damage: 20, type: 'physical', description: 'Hammer swing' },
      { damage: 14, type: 'physical', description: 'Quick jab' },
      { damage: 18, type: 'magical',  description: 'Poison spit' },
      { damage: 25, type: 'physical', description: 'Ground smash' },
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
    hp: 110,
    maxHp: 110,
    attackPattern: [
      { damage: 15, type: 'physical', description: 'Bite frenzy' },
      { damage: 15, type: 'physical', description: 'Bite frenzy' },
      { damage: 12, type: 'debuff',  description: 'Disease — drain' },
      { damage: 20, type: 'physical', description: 'Swarm rush' },
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
    hp: 250,
    maxHp: 250,
    attackPattern: [
      { damage: 30, type: 'physical', description: 'Slam' },
      { damage: 18, type: 'physical', description: 'Shockwave' },
      { damage: 0,  type: 'debuff',  description: 'Block Reel 1' },
      { damage: 40, type: 'physical', description: 'Overcharge crush' },
      { damage: 22, type: 'magical',  description: 'Electric surge' },
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
    hp: 160,
    maxHp: 160,
    attackPattern: [
      { damage: 28, type: 'physical', description: 'Dark slash' },
      { damage: 20, type: 'magical',  description: 'Soul drain' },
      { damage: 24, type: 'physical', description: 'Shadow lunge' },
      { damage: 0,  type: 'debuff',  description: 'Darkness — blind' },
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
    hp: 140,
    maxHp: 140,
    attackPattern: [
      { damage: 24, type: 'magical',  description: 'Frost bolt' },
      { damage: 0,  type: 'debuff',  description: 'Freeze — miss auto' },
      { damage: 32, type: 'magical',  description: 'Death coil' },
      { damage: 18, type: 'magical',  description: 'Bone shard' },
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
    hp: 400,
    maxHp: 400,
    attackPattern: [
      { damage: 35, type: 'physical', description: 'Void strike' },
      { damage: 28, type: 'magical',  description: 'Soul burst' },
      { damage: 0,  type: 'debuff',  description: 'Block 2 reels' },
      { damage: 45, type: 'magical',  description: 'Apocalypse' },
      { damage: 32, type: 'physical', description: 'Throne crush' },
      { damage: 0,  type: 'debuff',  description: 'Dark shroud' },
    ],
    patternIndex: 0,
    statusEffects: [],
    blockedReels: [],
    isBoss: true,
  },
]

const ALL_ENEMIES = [...SWAMP_ENEMIES, ...SEWER_ENEMIES, ...CITADEL_ENEMIES]

const HP_SCALE_PER_TIER = 0.18
const DAMAGE_SCALE_PER_TIER = 0.12

function scaleEnemy(enemy: Enemy, worldTier: number): Enemy {
  const tier = Math.max(0, worldTier)
  const hpScale = 1 + tier * HP_SCALE_PER_TIER
  const damageScale = 1 + tier * DAMAGE_SCALE_PER_TIER
  const scaledMaxHp = Math.round(enemy.maxHp * hpScale)

  return {
    ...enemy,
    name: tier > 0 ? `${enemy.name} +${tier}` : enemy.name,
    hp: scaledMaxHp,
    maxHp: scaledMaxHp,
    attackPattern: enemy.attackPattern.map((attack) => ({
      ...attack,
      damage: attack.damage > 0 ? Math.round(attack.damage * damageScale) : 0,
    })),
    patternIndex: 0,
  }
}

export function getRandomEnemy(zone: ZoneType, bossOnly = false, worldTier = 0): Enemy {
  const pool = zone === 'swamp' ? SWAMP_ENEMIES
    : zone === 'sewer' ? SEWER_ENEMIES : CITADEL_ENEMIES
  const filtered = bossOnly ? pool.filter((e) => e.isBoss) : pool.filter((e) => !e.isBoss)
  const enemy = filtered[Math.floor(Math.random() * filtered.length)]
  return scaleEnemy(enemy, worldTier)
}

export { ALL_ENEMIES }
