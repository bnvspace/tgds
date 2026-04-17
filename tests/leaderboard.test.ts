import { describe, expect, it } from 'vitest'
import { calcScore } from '@/utils/leaderboard'

describe('calcScore', () => {
  it('adds token and fight values without survival bonus on failed runs', () => {
    expect(calcScore({
      tokens: 12,
      fightsWon: 3,
      survived: false,
    })).toBe(2700)
  })

  it('adds the survival bonus on completed runs', () => {
    expect(calcScore({
      tokens: 12,
      fightsWon: 3,
      survived: true,
    })).toBe(3700)
  })
})
