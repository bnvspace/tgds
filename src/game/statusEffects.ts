import type { Enemy, StatusEffect } from '@/types'

export const POISON_DAMAGE_PER_STACK = 3  // per stack per turn, ignores armor

/**
 * Apply poison stacks to an enemy.
 * Stacks are additive. Duration resets to 3 turns.
 */
export function applyPoison(enemy: Enemy, stacks: number): Enemy {
  if (stacks <= 0) return enemy

  const existing = enemy.statusEffects.find((effect) => effect.type === 'poison')

  const nextEffects: StatusEffect[] = existing
    ? enemy.statusEffects.map((effect) =>
        effect.type === 'poison'
          ? { ...effect, value: effect.value + stacks, duration: 3 }
          : effect,
      )
    : [
        ...enemy.statusEffects,
        { type: 'poison' as const, value: stacks, duration: 3 },
      ]

  return { ...enemy, statusEffects: nextEffects }
}

/**
 * Apply stun to an enemy.
 * Stun does NOT stack — only refreshes duration if already stunned.
 */
export function applyStun(enemy: Enemy, turns: number): Enemy {
  if (turns <= 0) return enemy

  const existing = enemy.statusEffects.find((effect) => effect.type === 'freeze')

  const nextEffects: StatusEffect[] = existing
    ? enemy.statusEffects.map((effect) =>
        effect.type === 'freeze'
          ? { ...effect, duration: Math.max(effect.duration, turns) }
          : effect,
      )
    : [
        ...enemy.statusEffects,
        { type: 'freeze' as const, value: 0, duration: turns },
      ]

  return { ...enemy, statusEffects: nextEffects }
}

/**
 * Check if the enemy is currently stunned.
 */
export function isStunned(enemy: Enemy): boolean {
  return enemy.statusEffects.some(
    (effect) => effect.type === 'freeze' && effect.duration > 0,
  )
}

/**
 * Tick all status effects at the start of the enemy's turn.
 * Returns the updated enemy and the poison damage dealt.
 */
export function tickStatusEffects(enemy: Enemy): {
  enemy: Enemy
  poisonDamage: number
} {
  let poisonDamage = 0

  const nextEffects = enemy.statusEffects
    .map((effect): StatusEffect => {
      if (effect.type === 'poison') {
        poisonDamage += effect.value * POISON_DAMAGE_PER_STACK
        return { ...effect, duration: effect.duration - 1 }
      }
      if (effect.type === 'freeze') {
        return { ...effect, duration: effect.duration - 1 }
      }
      return effect
    })
    .filter((effect) => effect.duration > 0)

  return {
    enemy: {
      ...enemy,
      hp: Math.max(0, enemy.hp - poisonDamage),
      statusEffects: nextEffects,
    },
    poisonDamage,
  }
}
