import { describe, expect, it } from 'vitest'
import { ALL_SYMBOLS } from '@/game/symbols'
import { makeDefaultTiming } from '@/game/skillCheck'
import { preResolveModifiers } from '@/game/resolution'

function getSymbol(id: string) {
  const symbol = ALL_SYMBOLS.find((candidate) => candidate.id === id)

  if (!symbol) {
    throw new Error(`Missing symbol: ${id}`)
  }

  return symbol
}

describe('preResolveModifiers', () => {
  it('rerolls the right neighbor of diamond when timing is not perfect', () => {
    const diamond = getSymbol('diamond')
    const dagger = getSymbol('dagger')
    const coin = getSymbol('coin')

    const result = preResolveModifiers(
      [diamond, dagger],
      [makeDefaultTiming(), makeDefaultTiming()],
      [{ symbol: coin, weight: 10 }],
    )

    expect(result.symbols[1]?.id).toBe('coin')
    expect(result.timings[1]?.tier).toBe('ok')
    expect(result.rerollsApplied).toEqual([1])
  })

  it('forces both neighbors of sawblade to perfect timing', () => {
    const coin = getSymbol('coin')
    const sawblade = getSymbol('sawblade')
    const bomb = getSymbol('bomb')

    const result = preResolveModifiers(
      [coin, sawblade, bomb],
      [makeDefaultTiming(), makeDefaultTiming(), makeDefaultTiming()],
      [{ symbol: coin, weight: 10 }],
    )

    expect(result.timings[0]?.tier).toBe('perfect')
    expect(result.timings[2]?.tier).toBe('perfect')
    expect(result.rerollsApplied).toEqual([0, 2])
  })
})
