import type { GameSymbol, WeightedSymbol, Reel, QTETier, QTEResult } from '@/types'
import { QTE_MULTIPLIERS } from '@/types'

// ── Weighted random ────────────────────────────────────────
export function weightedRandom(pool: WeightedSymbol[]): GameSymbol {
  const totalWeight = pool.reduce((sum, w) => sum + w.weight, 0)
  let rand = Math.random() * totalWeight
  for (const entry of pool) {
    rand -= entry.weight
    if (rand <= 0) return entry.symbol
  }
  return pool[pool.length - 1].symbol
}

// ── Spin ──────────────────────────────────────────────────
// Returns one symbol per reel. NOT a grid. NOT paylines.
export function spin(reels: Reel[]): GameSymbol[] {
  return reels.map((reel) => weightedRandom(reel.symbolPool))
}

// ── QTE helpers ───────────────────────────────────────────
export function makeQTEResult(tier: QTETier): QTEResult {
  return {
    tier,
    multiplier: QTE_MULTIPLIERS[tier] as 1 | 1.5 | 2 | 3,
  }
}

// Mega crit: 3+ symbols share a tag AND qte is crit or better
export function checkMegaCrit(symbols: GameSymbol[], tier: QTETier): boolean {
  if (tier === 'miss' || tier === 'hit') return false
  const tagCounts: Record<string, number> = {}
  for (const s of symbols) {
    for (const tag of s.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }
  return Object.values(tagCounts).some((count) => count >= 3)
}
