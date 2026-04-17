import { describe, expect, it } from 'vitest'
import { STARTER_REELS, ALL_SYMBOLS } from '@/game/symbols'
import { resolveSymbols } from '@/game/resolution'
import { makeDefaultTiming } from '@/game/skillCheck'
import type { Player } from '@/types'

function getSymbol(id: string) {
  const symbol = ALL_SYMBOLS.find((candidate) => candidate.id === id)

  if (!symbol) {
    throw new Error(`Missing symbol: ${id}`)
  }

  return symbol
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    hp: 100,
    maxHp: 100,
    armor: 0,
    reels: STARTER_REELS,
    symbolInventory: [],
    relics: [],
    tokens: 0,
    bombCharge: 0,
    metaModifiers: [],
    fightsWon: 0,
    extraLives: 0,
    ...overrides,
  }
}

describe('resolveSymbols', () => {
  it('applies match-3 and coin synergy to token rewards', () => {
    const coin = getSymbol('coin')
    const result = resolveSymbols(
      [coin, coin, coin],
      [makeDefaultTiming(), makeDefaultTiming(), makeDefaultTiming()],
      makePlayer(),
    )

    expect(result.matchGroups).toHaveLength(1)
    expect(result.matchGroups[0]?.count).toBe(3)
    expect(result.baseTokens).toBe(45)
    expect(result.totalTokens).toBe(65)
    expect(result.totalDamage).toBe(0)
  })

  it('scales axe damage from the current player armor', () => {
    const axe = getSymbol('axe')
    const result = resolveSymbols(
      [axe],
      [makeDefaultTiming()],
      makePlayer({ armor: 20 }),
    )

    expect(result.baseDamage).toBe(38)
    expect(result.totalPhysicalDamage).toBe(38)
  })

  it('adds persistent bomb damage and increments bomb charge gain', () => {
    const bomb = getSymbol('bomb')
    const result = resolveSymbols(
      [bomb],
      [makeDefaultTiming()],
      makePlayer({ bombCharge: 2 }),
    )

    expect(result.baseDamage).toBe(18)
    expect(result.totalPhysicalDamage).toBe(18)
    expect(result.bombChargeGained).toBe(1)
  })
})
