import type { Enemy, GameSymbol, Player, QTEResult, SpinResult, Synergy } from '@/types'
import { detectSynergies } from './synergies'

export function resolveSymbols(
  symbols: GameSymbol[],
  qte: QTEResult,
  player: Player,
  _enemy: Enemy,
): SpinResult {
  const physicalStrengthRanks = player.metaModifiers
    .filter((modifier) => modifier.id === 'physical_strength')
    .length
  const tokenCollectorRanks = player.metaModifiers
    .filter((modifier) => modifier.id === 'token_collector')
    .length

  const rolledSymbols = symbols

  let baseDamage = 0
  let baseMagicDamage = 0
  let baseArmor = 0
  let baseTokens = 0
  let baseHeal = 0

  for (const symbol of rolledSymbols) {
    const effect = symbol.effect
    baseDamage += (effect.damage ?? 0) * symbol.level
    baseMagicDamage += (effect.magicDamage ?? 0) * symbol.level
    baseArmor += (effect.armor ?? 0) * symbol.level
    baseTokens += (effect.tokens ?? 0) * symbol.level
    baseHeal += (effect.heal ?? 0) * symbol.level
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
