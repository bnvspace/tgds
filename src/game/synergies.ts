import type { GameSymbol, SymbolTag } from '@/types'
import type { Synergy } from '@/types'

// All synergies are TAG-BASED, not symbol-ID based.
// They trigger ONLY within one spin — never persistent.

export const SYNERGIES: Synergy[] = [
  {
    id: 'bomb_diamond',
    name: 'Explosion Boost',
    description: 'Bomb + Diamond → damage ×2',
    requiredTags: ['explosive', 'diamond'],
    damageMultiplier: 2.0,
  },
  {
    id: 'triple_coin',
    name: 'Economy Chain',
    description: '3× Coin → +20 bonus tokens',
    requiredTags: ['coin', 'coin', 'coin'],
    bonusTokens: 20,
  },
  {
    id: 'double_shield',
    name: 'Reinforce',
    description: '2× Shield → +15 bonus armor',
    requiredTags: ['shield', 'shield'],
    bonusArmor: 15,
  },
  {
    id: 'weapon_diamond',
    name: 'Diamond Edge',
    description: 'Weapon + Diamond → damage ×1.5',
    requiredTags: ['weapon', 'diamond'],
    damageMultiplier: 1.5,
  },
]

// ── Synergy detection ─────────────────────────────────────
function getTagsFromSymbols(symbols: GameSymbol[]): SymbolTag[] {
  return symbols.flatMap((s) => s.tags)
}

function hasRequiredTags(availableTags: SymbolTag[], required: SymbolTag[]): boolean {
  const pool = [...availableTags]
  for (const tag of required) {
    const idx = pool.indexOf(tag)
    if (idx === -1) return false
    pool.splice(idx, 1)
  }
  return true
}

export function detectSynergies(symbols: GameSymbol[]): Synergy[] {
  const tags = getTagsFromSymbols(symbols)
  return SYNERGIES.filter((syn) => hasRequiredTags(tags, syn.requiredTags))
}
