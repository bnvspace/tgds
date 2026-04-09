import type { GameSymbol, WeightedSymbol, Reel, QTETier, QTEResult } from '@/types'
import { QTE_MULTIPLIERS } from '@/types'

const JACKPOT_MIN_MATCH = 3

export function weightedRandom(pool: WeightedSymbol[]): GameSymbol {
  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * totalWeight

  for (const entry of pool) {
    roll -= entry.weight
    if (roll <= 0) {
      return entry.symbol
    }
  }

  return pool[pool.length - 1].symbol
}

export function isJackpotSpin(symbols: GameSymbol[]): boolean {
  const counts = new Map<string, number>()

  for (const symbol of symbols) {
    const nextCount = (counts.get(symbol.id) ?? 0) + 1
    counts.set(symbol.id, nextCount)

    if (nextCount >= JACKPOT_MIN_MATCH) {
      return true
    }
  }

  return false
}

export function spin(reels: Reel[]): GameSymbol[] {
  return reels.map((reel) => weightedRandom(reel.symbolPool))
}

export function makeQTEResult(tier: QTETier): QTEResult {
  return {
    tier,
    multiplier: QTE_MULTIPLIERS[tier] as 1 | 1.5 | 2 | 3,
  }
}
