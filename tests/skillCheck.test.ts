import { describe, expect, it } from 'vitest'
import { ALL_SYMBOLS } from '@/game/symbols'
import {
  bestWeaponTiming,
  evaluateStopTiming,
  getSymbolTimingMultiplier,
} from '@/game/skillCheck'

function getSymbol(id: string) {
  const symbol = ALL_SYMBOLS.find((candidate) => candidate.id === id)

  if (!symbol) {
    throw new Error(`Missing symbol: ${id}`)
  }

  return symbol
}

describe('skillCheck', () => {
  it('wraps stop timing around the reel boundary', () => {
    const result = evaluateStopTiming(0.98, 0.02)

    expect(result.offset).toBeCloseTo(0.04)
    expect(result.tier).toBe('perfect')
    expect(result.multiplier).toBe(2)
  })

  it('applies timing bonuses only to damage symbols and finds the best weapon timing', () => {
    const coin = getSymbol('coin')
    const dagger = getSymbol('dagger')
    const perfect = evaluateStopTiming(0, 0)
    const good = evaluateStopTiming(0.2, 0)

    expect(getSymbolTimingMultiplier(coin, perfect)).toBe(1)
    expect(getSymbolTimingMultiplier(dagger, good)).toBe(1.5)
    expect(bestWeaponTiming([coin, dagger], [perfect, good])).toBe('good')
  })
})
