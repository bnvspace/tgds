import type { GameSymbol, WeightedSymbol, Reel, QTETier, QTEResult } from '@/types'
import { QTE_MULTIPLIERS } from '@/types'

const JACKPOT_MIN_MATCH = 3
const BONUS_JACKPOT_CHANCE = 0.22

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

function pickRandomItems<T>(items: T[], count: number): T[] {
  const pool = [...items]

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]]
  }

  return pool.slice(0, count)
}

function buildForcedJackpotSpin(reels: Reel[]): GameSymbol[] | null {
  const symbolCoverage = new Map<string, {
    symbol: GameSymbol
    reelIndices: number[]
    totalWeight: number
  }>()

  reels.forEach((reel, reelIndex) => {
    const seenIds = new Set<string>()

    reel.symbolPool.forEach(({ symbol, weight }) => {
      const entry = symbolCoverage.get(symbol.id) ?? {
        symbol,
        reelIndices: [],
        totalWeight: 0,
      }

      if (!seenIds.has(symbol.id)) {
        entry.reelIndices.push(reelIndex)
        seenIds.add(symbol.id)
      }

      entry.totalWeight += weight
      symbolCoverage.set(symbol.id, entry)
    })
  })

  const eligibleSymbols = Array.from(symbolCoverage.values()).filter(
    (entry) => entry.reelIndices.length >= JACKPOT_MIN_MATCH,
  )

  if (eligibleSymbols.length === 0) {
    return null
  }

  const totalWeight = eligibleSymbols.reduce((sum, entry) => sum + entry.totalWeight, 0)
  let roll = Math.random() * totalWeight
  let selected = eligibleSymbols[eligibleSymbols.length - 1]

  for (const entry of eligibleSymbols) {
    roll -= entry.totalWeight
    if (roll <= 0) {
      selected = entry
      break
    }
  }

  const jackpotReels = new Set(pickRandomItems(selected.reelIndices, JACKPOT_MIN_MATCH))

  return reels.map((reel, reelIndex) => (
    jackpotReels.has(reelIndex)
      ? selected.symbol
      : weightedRandom(reel.symbolPool)
  ))
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
  const naturalSpin = reels.map((reel) => weightedRandom(reel.symbolPool))

  if (isJackpotSpin(naturalSpin) || Math.random() >= BONUS_JACKPOT_CHANCE) {
    return naturalSpin
  }

  return buildForcedJackpotSpin(reels) ?? naturalSpin
}

export function makeQTEResult(tier: QTETier): QTEResult {
  return {
    tier,
    multiplier: QTE_MULTIPLIERS[tier] as 1 | 1.5 | 2 | 3,
  }
}
