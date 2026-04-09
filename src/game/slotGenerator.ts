import type { GameSymbol, WeightedSymbol } from '@/types'

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

export function spin(symbolPool: WeightedSymbol[], reelCount: number): GameSymbol[] {
  if (symbolPool.length === 0 || reelCount <= 0) {
    return []
  }

  return Array.from({ length: reelCount }, () => weightedRandom(symbolPool))
}

