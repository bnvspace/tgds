import type { GameSymbol, TimingTier, TimingResult } from '@/types'
import { TIMING } from '@/constants'

/**
 * Evaluate the quality of a manual reel stop.
 *
 * @param stopOffset  - normalized 0..1 position where the player stopped
 * @param targetOffset - normalized 0..1 position of the ideal stop
 * @returns TimingResult with tier, multiplier, and offset distance
 */
export function evaluateStopTiming(
  stopOffset: number,
  targetOffset: number,
): TimingResult {
  // Distance wraps around at 0/1 boundary (circular)
  const rawDistance = Math.abs(stopOffset - targetOffset)
  const offset = Math.min(rawDistance, 1 - rawDistance)

  let tier: TimingTier = 'ok'
  let multiplier: number = TIMING.OK_MULTIPLIER

  if (offset <= TIMING.PERFECT_THRESHOLD) {
    tier = 'perfect'
    multiplier = TIMING.PERFECT_MULTIPLIER
  } else if (offset <= TIMING.GOOD_THRESHOLD) {
    tier = 'good'
    multiplier = TIMING.GOOD_MULTIPLIER
  }

  return { tier, multiplier, offset }
}

/**
 * Compute timing multiplier for a single symbol on a specific reel.
 * Only symbols with the 'weapon' or 'explosive' tag benefit from timing.
 * All other symbols always get ×1.0.
 */
export function getSymbolTimingMultiplier(
  symbol: GameSymbol,
  timing: TimingResult,
): number {
  const hasDamageTiming = symbol.tags.some(
    (tag) => tag === 'weapon' || tag === 'explosive',
  )

  if (!hasDamageTiming) {
    return TIMING.OK_MULTIPLIER
  }

  return timing.multiplier
}

/**
 * Find the best timing tier among weapon/explosive symbols.
 * Returns null if no weapon symbols were rolled.
 */
export function bestWeaponTiming(
  symbols: GameSymbol[],
  timings: TimingResult[],
): TimingTier | null {
  const TIER_PRIORITY: Record<TimingTier, number> = {
    perfect: 3,
    good: 2,
    ok: 1,
  }

  let best: TimingTier | null = null

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i]
    const timing = timings[i]
    if (!symbol || !timing) continue

    const hasDamageTiming = symbol.tags.some(
      (tag) => tag === 'weapon' || tag === 'explosive',
    )
    if (!hasDamageTiming) continue

    if (best === null || TIER_PRIORITY[timing.tier] > TIER_PRIORITY[best]) {
      best = timing.tier
    }
  }

  return best
}

/**
 * Build a default "ok" timing result for cases where timing is not evaluated
 * (e.g. legacy paths or auto-resolve).
 */
export function makeDefaultTiming(): TimingResult {
  return {
    tier: 'ok',
    multiplier: TIMING.OK_MULTIPLIER,
    offset: 1,
  }
}
