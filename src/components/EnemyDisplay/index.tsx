import type { CSSProperties } from 'react'
import { symbolIconById, zoneBackdropByZone } from '@/assets/pixelArt'
import CombatVfxLayer from '@/components/CombatVfxLayer'
import GameIcon from '@/components/GameIcon'
import { useTranslation } from '@/i18n'
import type { Enemy, SpinResult } from '@/types'
import styles from './EnemyDisplay.module.css'

interface EnemyDisplayProps {
  enemy: Enemy
  combatPhase?: string
  lastSpinResult?: SpinResult | null
}

const intentIconByType = {
  physical: symbolIconById.dagger,
  magical: symbolIconById.magic_scroll,
  debuff: symbolIconById.poison_vial,
} as const

const STATUS_ICON: Record<string, string> = {
  poison: '☠',
  freeze: '⚡',
  burn: '🔥',
  block_reel: '🔒',
}

export default function EnemyDisplay({
  enemy,
  combatPhase = 'player_idle',
  lastSpinResult = null,
}: EnemyDisplayProps) {
  const currentPattern = enemy.attackPattern[enemy.patternIndex]
  const intentStep = enemy.patternIndex + 1
  const intentTotalSteps = enemy.attackPattern.length
  const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100)
  const {
    t,
    localizeAttackDescription,
    localizeAttackType,
    localizeEnemyName,
  } = useTranslation()

  const poisonEffect = enemy.statusEffects.find((e) => e.type === 'poison')
  const isStunned = enemy.statusEffects.some((e) => e.type === 'freeze' && e.duration > 0)

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.viewport} ${enemy.isBoss ? styles.bossViewport : ''}`}
        data-zone={enemy.zone}
        data-phase={combatPhase}
        style={{ '--enemy-backdrop': `url("${zoneBackdropByZone[enemy.zone]}")` } as CSSProperties}
      >
        <div className={styles.ambientGlow} aria-hidden="true" />
        <div className={styles.ambientMist} aria-hidden="true" />
        <div className={styles.stageShadow} aria-hidden="true" />
        <CombatVfxLayer result={lastSpinResult} zone={enemy.zone} />
        <GameIcon
          icon={enemy.icon}
          alt={localizeEnemyName(enemy)}
          className={`${styles.icon} ${isStunned ? styles.stunned : ''}`}
        />
        {enemy.statusEffects.length > 0 && (
          <div className={styles.statusBadges}>
            {enemy.statusEffects.map((statusEffect, index) => (
              <span key={index} className={styles.badge} data-type={statusEffect.type}>
                {STATUS_ICON[statusEffect.type] ?? '?'}
                {statusEffect.type === 'poison' ? statusEffect.value : statusEffect.duration}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.hpRow}>
        <span className={styles.hpLabel}>{localizeEnemyName(enemy)}</span>
        <div className={styles.hpMeta}>
          {enemy.armor > 0 && (
            <span className={styles.armorBadge}>
              🛡 {enemy.armor}
            </span>
          )}
          {poisonEffect && (
            <span className={styles.poisonBadge}>
              ☠ {poisonEffect.value}×{poisonEffect.duration}
            </span>
          )}
          <span className={styles.hpValues}>{enemy.hp}/{enemy.maxHp}</span>
        </div>
      </div>
      <div className={styles.hpBar}>
        <div className={styles.hpFill} style={{ width: `${hpPercent}%` }} />
        {enemy.armor > 0 && (
          <div
            className={styles.armorOverlay}
            style={{ width: `${Math.min(100, (enemy.armor / enemy.maxHp) * 100 * 8)}%` }}
          />
        )}
      </div>

      {currentPattern && (() => {
        const hits = currentPattern.hits && currentPattern.hits.length > 0 
          ? currentPattern.hits 
          : [{ damage: currentPattern.damage!, type: currentPattern.type!, description: currentPattern.description! }]
        const totalDamage = hits.reduce((sum, h) => sum + h.damage, 0)
        const primaryType = hits[0].type
        const displayDesc = currentPattern.description || hits.map((h) => localizeAttackDescription(h.description)).join(' + ')
        
        const effectiveDmg = primaryType === 'physical' && enemy.armor > 0
          ? Math.max(0, totalDamage - enemy.armor)
          : totalDamage
        const armorReduces = primaryType === 'physical' && enemy.armor > 0

        return (
          <div className={styles.nextAttack} data-attack={primaryType}>
            <span className={styles.intentBadge} data-attack={primaryType}>
              <GameIcon
                icon={intentIconByType[primaryType]}
                alt={localizeAttackType(primaryType)}
                decorative
                className={styles.intentIcon}
              />
            </span>
            <div className={styles.attackCopy}>
              <div className={styles.intentMetaRow}>
                <span className={styles.nextLabel}>{t('intent_label')}</span>
                <span className={styles.intentCycle}>
                  {t('intent_cycle')} {intentStep}/{intentTotalSteps}
                </span>
              </div>
              <span className={styles.attackType}>
                {hits.length > 1 ? `${hits.length}x Multi-Hit` : localizeAttackType(primaryType)}
              </span>
              <span className={styles.attackDesc}>{displayDesc}</span>
            </div>
            <div className={styles.attackDmgCol}>
              <span className={styles.attackDmg}>-{effectiveDmg}</span>
              {armorReduces && (
                <span className={styles.attackDmgReduced}>
                  -{totalDamage} 🛡 {enemy.armor}
                </span>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
