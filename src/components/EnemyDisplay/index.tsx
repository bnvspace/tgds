import type { Enemy } from '@/types'
import styles from './EnemyDisplay.module.css'

interface EnemyDisplayProps {
  enemy: Enemy
}

export default function EnemyDisplay({ enemy }: EnemyDisplayProps) {
  const currentPattern = enemy.attackPattern[enemy.patternIndex]
  const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100)

  const attackTypeLabel: Record<string, string> = {
    physical: '⚔ Physical',
    magical: '✨ Magical',
    debuff: '☠ Debuff',
  }

  return (
    <div className={styles.wrap}>
      {/* Enemy viewport */}
      <div className={styles.viewport}>
        <span className={styles.icon}>{enemy.icon}</span>
        {enemy.statusEffects.length > 0 && (
          <div className={styles.statusBadges}>
            {enemy.statusEffects.map((e, i) => (
              <span key={i} className={styles.badge} data-type={e.type}>
                {e.type === 'poison' ? '☠' : e.type === 'freeze' ? '❄' : '🔥'}
                {e.duration}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* HP bar */}
      <div className={styles.hpRow}>
        <span className={styles.hpLabel}>{enemy.name}</span>
        <span className={styles.hpValues}>{enemy.hp}/{enemy.maxHp}</span>
      </div>
      <div className={styles.hpBar}>
        <div className={styles.hpFill} style={{ width: `${hpPercent}%` }} />
      </div>

      {/* Next attack (telegraphed) */}
      {currentPattern && (
        <div className={styles.nextAttack}>
          <span className={styles.nextLabel}>NEXT:</span>
          <span className={styles.attackType}>
            {attackTypeLabel[currentPattern.type]}
          </span>
          <span className={styles.attackDmg}>-{currentPattern.damage}</span>
          <span className={styles.attackDesc}>{currentPattern.description}</span>
        </div>
      )}
    </div>
  )
}
