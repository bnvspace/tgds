import type { GameSymbol, MatchGroup, Player, QTEResult, SpinResult, Synergy } from '@/types'
import { detectSynergies } from './synergies'

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

export function resolveSymbols(
  symbols: GameSymbol[],
  qte: QTEResult,
  player: Player,
): SpinResult {
  const physicalStrengthRanks = player.metaModifiers
    .filter((modifier) => modifier.id === 'physical_strength')
    .length
  const tokenCollectorRanks = player.metaModifiers
    .filter((modifier) => modifier.id === 'token_collector')
    .length

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

  for (const symbol of rolledSymbols) {
    const effect = symbol.effect
    const matchMultiplier = matchMultipliers.get(symbol.id) ?? 1

    baseDamage += (effect.damage ?? 0) * symbol.level * matchMultiplier
    baseMagicDamage += (effect.magicDamage ?? 0) * symbol.level * matchMultiplier
    baseArmor += (effect.armor ?? 0) * symbol.level * matchMultiplier
    baseTokens += (effect.tokens ?? 0) * symbol.level * matchMultiplier
    baseHeal += (effect.heal ?? 0) * symbol.level * matchMultiplier
  }

  const synergiesActivated: Synergy[] = detectSynergies(rolledSymbols)

  let synergyDamageMult = 1
  let synergyBonusTokens = 0
  let synergyBonusArmor = 0

  for (const synergy of synergiesActivated) {
    if (synergy.damageMultiplier) synergyDamageMult *= synergy.damageMultiplier
    if (synergy.bonusTokens) synergyBonusTokens += synergy.bonusTokens
    if (synergy.bonusArmor) synergyBonusArmor += synergy.bonusArmor
  }

  const physicalStrengthMult = 1 + physicalStrengthRanks * 0.2
  const tokenCollectorBonus = rolledSymbols
    .filter((symbol) => symbol.tags.includes('coin'))
    .reduce((sum) => sum + tokenCollectorRanks * 2, 0)

  const damage = baseDamage * physicalStrengthMult * synergyDamageMult
  const tokens = baseTokens + synergyBonusTokens + tokenCollectorBonus
  const armor = baseArmor + synergyBonusArmor

  for (const relic of player.relics) {
    if (relic.effect.damageReduction) {
      // Reserved for relic scaling.
    }
  }

  const totalDamage = damage * qte.multiplier
  const totalMagicDamage = baseMagicDamage * qte.multiplier

  return {
    rolledSymbols,
    qte,
    matchGroups,
    baseDamage,
    baseArmor,
    baseTokens,
    baseHeal,
    synergiesActivated,
    totalDamage: Math.max(0, totalDamage) + totalMagicDamage,
    totalArmor: armor,
    totalTokens: tokens,
    totalHeal: baseHeal,
  }
}
