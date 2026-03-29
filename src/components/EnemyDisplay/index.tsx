import type { Enemy } from '@/types'
import { useTranslation } from '@/i18n'
import styles from './EnemyDisplay.module.css'

interface EnemyDisplayProps {
  enemy: Enemy
}

export default function EnemyDisplay({ enemy }: EnemyDisplayProps) {
  const currentPattern = enemy.attackPattern[enemy.patternIndex]
  const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100)
  const {
    t,
    localizeAttackDescription,
    localizeAttackType,
    localizeEnemyName,
  } = useTranslation()

  return (
    <div className={styles.wrap}>
      <div className={`${styles.viewport} ${enemy.isBoss ? styles.bossViewport : ''}`}>
        <span className={styles.icon}>{enemy.icon}</span>
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
          <span className={styles.nextLabel}>{t('next_attack')}</span>
          <span className={styles.attackType}>{localizeAttackType(currentPattern.type)}</span>
          <span className={styles.attackDmg}>-{currentPattern.damage}</span>
          <span className={styles.attackDesc}>{localizeAttackDescription(currentPattern.description)}</span>
        </div>
      )}
    </div>
  )
}
