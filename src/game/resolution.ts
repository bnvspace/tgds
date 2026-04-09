import { BALANCE } from '@/constants'
import type { Enemy, GameSymbol, MatchGroup, Player, QTEResult, SpinResult, Synergy, TimingResult, WeightedSymbol } from '@/types'
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

/** Pick a random symbol from an inventory using weighted selection */
function weightedRandomSymbol(inventory: WeightedSymbol[]): GameSymbol {
  const total = inventory.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * total

  for (const entry of inventory) {
    roll -= entry.weight
    if (roll <= 0) return entry.symbol
  }

  return inventory[inventory.length - 1]!.symbol
}

/** Make a forced-perfect timing result */
function makePerfectTiming(): TimingResult {
  return { tier: 'perfect', multiplier: 2.0, offset: 0 }
}

/**
 * Pre-resolve modifiers — apply Diamond and Sawblade effects BEFORE resolution.
 *
 * Diamond (id='diamond'): rerolls the reel immediately to the right if that reel
 * has non-perfect timing. New symbol is drawn from inventory; timing stays 'ok'.
 *
 * Sawblade (effect.isSawblade): forces both neighbors (left + right) to 'perfect'
 * timing. The symbols stay, but get ×2 damage multiplier.
 *
 * Returns modified copies of symbols and timings, plus which reel indices were affected.
 */
export function preResolveModifiers(
  symbols: GameSymbol[],
  timings: TimingResult[],
  inventory: WeightedSymbol[],
): { symbols: GameSymbol[]; timings: TimingResult[]; rerollsApplied: number[] } {
  const resultSymbols = [...symbols]
  const resultTimings = [...timings]
  const rerollsApplied: number[] = []

  if (inventory.length === 0) {
    return { symbols: resultSymbols, timings: resultTimings, rerollsApplied }
  }

  for (let i = 0; i < resultSymbols.length; i++) {
    const symbol = resultSymbols[i]
    if (!symbol) continue

    // Sawblade: force both neighbors to perfect
    if (symbol.effect.isSawblade) {
      const neighbors = [i - 1, i + 1]

      for (const ni of neighbors) {
        if (ni >= 0 && ni < resultSymbols.length) {
          resultTimings[ni] = makePerfectTiming()
          if (!rerollsApplied.includes(ni)) rerollsApplied.push(ni)
        }
      }
    }
  }

  for (let i = 0; i < resultSymbols.length; i++) {
    const symbol = resultSymbols[i]
    if (!symbol) continue

    // Diamond: reroll right neighbor if not perfect
    if (symbol.id === 'diamond') {
      const rightIdx = i + 1

      if (rightIdx < resultSymbols.length) {
        const rightTiming = resultTimings[rightIdx]

        if (rightTiming && rightTiming.tier !== 'perfect') {
          resultSymbols[rightIdx] = weightedRandomSymbol(inventory)
          resultTimings[rightIdx] = makeDefaultTiming()
          if (!rerollsApplied.includes(rightIdx)) rerollsApplied.push(rightIdx)
        }
      }
    }
  }

  return { symbols: resultSymbols, timings: resultTimings, rerollsApplied }
}

/**
 * Resolve symbols using per-reel timing results.
 *
 * Damage model:
 *   - physical → reduced by enemy.armor
 *   - magic    → bypasses armor
 *   - poison   → stacks applied to enemy; ticks as DoT, bypasses armor
 *   - stun     → enemy skips next action
 *   - bomb     → base + player.bombCharge × BOMB_PER_CHARGE_DMG (physical)
 *   - axe      → base + enemy.armor × AXE_ARMOR_MULT (physical)
 *   - sawblade → no direct damage; forces neighbor perfect timing (handled in preResolveModifiers)
 *
 * Timing multipliers apply ONLY to weapon/explosive physical and magic damage.
 * Armor, heal, tokens, poison stacks are NEVER affected by timing.
 */
export function resolveSymbols(
  symbols: GameSymbol[],
  timingResults: TimingResult[],
  player: Player,
  enemy: Enemy | null = null,
  rerollsApplied: number[] = [],
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
  let bombChargeGained = 0

  // Per-symbol accumulation with timing multipliers on damage
  let totalTimingWeightedDamage = 0
  let totalTimingWeightedMagicDamage = 0

  for (let i = 0; i < rolledSymbols.length; i++) {
    const symbol = rolledSymbols[i]
    if (!symbol) continue

    const effect = symbol.effect
    const matchMultiplier = matchMultipliers.get(symbol.id) ?? 1
    const timingMultiplier = getSymbolTimingMultiplier(symbol, timings[i] ?? makeDefaultTiming())

    // ── Base damage ──────────────────────────────────────────
    let symbolDamage = (effect.damage ?? 0) * symbol.level * matchMultiplier

    // Bomb: add persistent charge bonus on top of base damage
    if (effect.isBomb) {
      symbolDamage += player.bombCharge * BALANCE.BOMB_PER_CHARGE_DMG
      bombChargeGained += 1  // increment once per bomb in spin
    }

    // Axe: add armor-scaling bonus
    if (effect.isAxe && enemy && enemy.armor > 0) {
      symbolDamage += Math.floor(enemy.armor * BALANCE.AXE_ARMOR_MULT)
    }

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
    rerollsApplied,
    bombChargeGained,
  }
}
