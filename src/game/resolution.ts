import type { GameSymbol, Player, Enemy, SpinResult, QTEResult, Synergy } from '@/types'
import { detectSynergies } from './synergies'

/**
 * 7-step Symbol Resolution Pipeline (order is CRITICAL)
 *
 * 1. Collect symbols
 * 2. Apply base values
 * 3. Apply intra-spin synergies
 * 4. Apply relic modifiers
 * 5. Apply QTE multiplier (ONLY to damage)
 * 6. Apply enemy resistances
 * 7. Apply effects
 */
export function resolveSymbols(
  symbols: GameSymbol[],
  qte: QTEResult,
  player: Player,
  _enemy: Enemy
): SpinResult {
  // ── STEP 1: Collect ──────────────────────────────────
  const rolledSymbols = symbols

  // ── STEP 2: Base values ───────────────────────────────
  let baseDamage = 0
  let baseMagicDamage = 0
  let baseArmor = 0
  let baseTokens = 0
  let baseHeal = 0

  for (const sym of rolledSymbols) {
    const e = sym.effect
    baseDamage += (e.damage ?? 0) * sym.level
    baseMagicDamage += (e.magicDamage ?? 0) * sym.level
    baseArmor += (e.armor ?? 0) * sym.level
    baseTokens += (e.tokens ?? 0) * sym.level
    baseHeal += (e.heal ?? 0) * sym.level
  }

  // ── STEP 3: Synergies (S_syn) ─────────────────────────
  const synergiesActivated: Synergy[] = detectSynergies(rolledSymbols)

  let synergyDamageMult = 1
  let synergyBonusTokens = 0
  let synergyBonusArmor = 0

  for (const syn of synergiesActivated) {
    if (syn.damageMultiplier) synergyDamageMult *= syn.damageMultiplier
    if (syn.bonusTokens) synergyBonusTokens += syn.bonusTokens
    if (syn.bonusArmor) synergyBonusArmor += syn.bonusArmor
  }

  let damage = baseDamage * synergyDamageMult
  const tokens = baseTokens + synergyBonusTokens
  const armor = baseArmor + synergyBonusArmor

  // ── STEP 4: Relic modifiers (R_mod) ──────────────────
  for (const relic of player.relics) {
    if (relic.effect.damageReduction) {
      // relic can boost damage or other things — extend here
    }
  }

  // ── STEP 5: QTE multiplier (ONLY to damage) ───────────
  const totalDamage = damage * qte.multiplier
  const totalMagicDamage = baseMagicDamage * qte.multiplier

  // ── STEP 6: Enemy resistances ─────────────────────────
  // Physical: reduced by enemy armor (enemies can have armor in future)
  // Magical: bypasses armor
  const effectivePhysical = Math.max(0, totalDamage) // enemy armor placeholder
  const effectiveMagical = totalMagicDamage

  // ── STEP 7: Final totals ──────────────────────────────
  return {
    rolledSymbols,
    qte,
    baseDamage,
    baseArmor,
    baseTokens,
    baseHeal,
    synergiesActivated,
    totalDamage: effectivePhysical + effectiveMagical,
    totalArmor: armor,
    totalTokens: tokens,
    totalHeal: baseHeal,
  }
}
