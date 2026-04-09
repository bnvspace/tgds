import type { GameSymbol, MatchGroup, Player, QTEResult, SpinResult, Synergy, TimingResult } from '@/types'
import { detectSynergies } from './synergies'
import { getSymbolTimingMultiplier, bestWeaponTiming, makeDefaultTiming } from './skillCheck'

const MATCH_3_THRESHOLD = 3
const MATCH_3_MULTIPLIER = 3

function detectMatchGroups(symbols: GameSymbol[]): MatchGroup[] {
  const groups = new Map<string, { symbol: GameSymbol; count: number }>()

  for (const symbol of symbols) {
    const current = groups.get(symbol.id)

    if (current) {
      current.count += 1
      continue
    }

    groups.set(symbol.id, {
      symbol,
      count: 1,
    })
  }

  return Array.from(groups.values())
    .filter((group) => group.count >= MATCH_3_THRESHOLD)
    .map((group) => ({
      symbol: group.symbol,
      count: group.count,
      multiplier: MATCH_3_MULTIPLIER,
    }))
}

/**
 * Resolve symbols using per-reel timing results.
 *
 * Damage model:
 *   - physical → reduced by enemy.armor
 *   - magic    → bypasses armor
 *   - poison   → stacks applied to enemy; ticks as DoT, bypasses armor
 *   - stun     → enemy skips next action
 *
 * Timing multipliers apply ONLY to weapon/explosive physical and magic damage.
 * Armor, heal, tokens, poison stacks are NEVER affected by timing.
 */
export function resolveSymbols(
  symbols: GameSymbol[],
  timingResults: TimingResult[],
  player: Player,
): SpinResult {
  const physicalStrengthRanks = player.metaModifiers
    .filter((modifier) => modifier.id === 'physical_strength')
    .length
  const tokenCollectorRanks = player.metaModifiers
    .filter((modifier) => modifier.id === 'token_collector')
    .length

  // Pad timing results to match symbol count (fallback to 'ok')
  const timings = symbols.map((_, index) =>
    timingResults[index] ?? makeDefaultTiming(),
  )

  const rolledSymbols = symbols
  const matchGroups = detectMatchGroups(rolledSymbols)
  const matchMultipliers = new Map(
    matchGroups.map((group) => [group.symbol.id, group.multiplier] as const),
  )

  let baseDamage = 0
  let baseMagicDamage = 0
  let baseArmor = 0
  let baseTokens = 0
  let baseHeal = 0
  let poisonStacksApplied = 0
  let stunApplied = false

  // Per-symbol accumulation with timing multipliers on damage
  let totalTimingWeightedDamage = 0
  let totalTimingWeightedMagicDamage = 0

  for (let i = 0; i < rolledSymbols.length; i++) {
    const symbol = rolledSymbols[i]
    if (!symbol) continue

    const effect = symbol.effect
    const matchMultiplier = matchMultipliers.get(symbol.id) ?? 1
    const timingMultiplier = getSymbolTimingMultiplier(symbol, timings[i] ?? makeDefaultTiming())

    const symbolDamage = (effect.damage ?? 0) * symbol.level * matchMultiplier
    const symbolMagicDamage = (effect.magicDamage ?? 0) * symbol.level * matchMultiplier

    baseDamage += symbolDamage
    baseMagicDamage += symbolMagicDamage
    baseArmor += (effect.armor ?? 0) * symbol.level * matchMultiplier
    baseTokens += (effect.tokens ?? 0) * symbol.level * matchMultiplier
    baseHeal += (effect.heal ?? 0) * symbol.level * matchMultiplier

    // Poison stacks — NOT multiplied by timing (tactical, not skill-based)
    if (effect.poisonStacks) {
      poisonStacksApplied += effect.poisonStacks * symbol.level * matchMultiplier
    }

    // Stun — any stun symbol triggers it
    if (effect.stunTurns && effect.stunTurns > 0) {
      stunApplied = true
    }

    // Apply timing multiplier to damage only
    totalTimingWeightedDamage += symbolDamage * timingMultiplier
    totalTimingWeightedMagicDamage += symbolMagicDamage * timingMultiplier
  }

  const synergiesActivated: Synergy[] = detectSynergies(rolledSymbols)

  let synergyDamageMult = 1
  let synergyBonusTokens = 0
  let synergyBonusArmor = 0
  let synergyBonusDamage = 0

  for (const synergy of synergiesActivated) {
    if (synergy.damageMultiplier) synergyDamageMult *= synergy.damageMultiplier
    if (synergy.bonusTokens) synergyBonusTokens += synergy.bonusTokens
    if (synergy.bonusArmor) synergyBonusArmor += synergy.bonusArmor
    if (synergy.bonusDamage) synergyBonusDamage += synergy.bonusDamage
  }

  const physicalStrengthMult = 1 + physicalStrengthRanks * 0.2
  const tokenCollectorBonus = rolledSymbols
    .filter((symbol) => symbol.tags.includes('coin'))
    .reduce((sum) => sum + tokenCollectorRanks * 2, 0)

  // Physical damage pipeline: timing × strength modifier × synergy multiplier + bonus
  const physicalDamage = (totalTimingWeightedDamage * physicalStrengthMult * synergyDamageMult)
    + synergyBonusDamage

  // Magic damage pipeline: timing × synergy multiplier (no strength bonus — different stat)
  const magicDamage = totalTimingWeightedMagicDamage * synergyDamageMult

  const tokens = baseTokens + synergyBonusTokens + tokenCollectorBonus
  const armor = baseArmor + synergyBonusArmor

  // Build legacy QTE result from best timing for display compat
  const bestTier = bestWeaponTiming(symbols, timings)
  const legacyQte: QTEResult = {
    tier: bestTier === 'perfect' ? 'crit' : bestTier === 'good' ? 'hit' : 'miss',
    multiplier: bestTier === 'perfect' ? 2 : bestTier === 'good' ? 1.5 : 1,
  }

  const totalPhysicalDamage = Math.max(0, physicalDamage)
  const totalMagicDamage = Math.max(0, magicDamage)

  return {
    rolledSymbols,
    qte: legacyQte,
    timingResults: timings,
    matchGroups,
    baseDamage,
    baseMagicDamage,
    baseArmor,
    baseTokens,
    baseHeal,
    synergiesActivated,
    totalDamage: totalPhysicalDamage + totalMagicDamage,
    totalPhysicalDamage,
    totalMagicDamage,
    totalArmor: armor,
    totalTokens: tokens,
    totalHeal: baseHeal,
    poisonStacksApplied: Math.round(poisonStacksApplied),
    stunApplied,
    bestTimingTier: bestTier,
  }
}
