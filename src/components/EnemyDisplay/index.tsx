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
          className={styles.icon}
        />
        {enemy.statusEffects.length > 0 && (
          <div className={styles.statusBadges}>
            {enemy.statusEffects.map((statusEffect, index) => (
              <span key={index} className={styles.badge} data-type={statusEffect.type}>
                {statusEffect.type === 'poison' ? '☠' : statusEffect.type === 'freeze' ? '❄' : '🔥'}
                {statusEffect.duration}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.hpRow}>
        <span className={styles.hpLabel}>{localizeEnemyName(enemy)}</span>
        <span className={styles.hpValues}>{enemy.hp}/{enemy.maxHp}</span>
      </div>
      <div className={styles.hpBar}>
        <div className={styles.hpFill} style={{ width: `${hpPercent}%` }} />
      </div>

      {currentPattern && (
        <div className={styles.nextAttack}>
          <span className={styles.intentBadge} data-attack={currentPattern.type}>
            <GameIcon
              icon={intentIconByType[currentPattern.type]}
              alt={localizeAttackType(currentPattern.type)}
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
            <span className={styles.attackType}>{localizeAttackType(currentPattern.type)}</span>
            <span className={styles.attackDesc}>{localizeAttackDescription(currentPattern.description)}</span>
          </div>
          <span className={styles.attackDmg}>-{currentPattern.damage}</span>
        </div>
      )}
    </div>
  )
}
