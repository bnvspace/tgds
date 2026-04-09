import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { symbolIconById } from '@/assets/pixelArt'
import GameIcon from '@/components/GameIcon'
import type { QTETier, SpinResult, ZoneType } from '@/types'
import styles from './CombatVfxLayer.module.css'

interface CombatVfxLayerProps {
  result: SpinResult | null
  zone: ZoneType
}

interface BurstChip {
  id: string
  icon: string
  value: string
  tone: 'damage' | 'armor' | 'tokens' | 'heal' | 'combo'
}

interface BurstState {
  id: number
  chips: BurstChip[]
  qteTier: QTETier
  showDamage: boolean
  showArmor: boolean
  showTokens: boolean
  showHeal: boolean
}

function createBurstState(result: SpinResult, id: number): BurstState {
  const chips: BurstChip[] = [
    result.matchGroups.length > 0
      ? {
        id: 'combo',
        icon: symbolIconById.diamond,
        value: 'x3',
        tone: 'combo',
      }
      : null,
    result.totalDamage > 0
      ? {
        id: 'damage',
        icon: symbolIconById.dagger,
        value: `-${Math.round(result.totalDamage)}`,
        tone: 'damage',
      }
      : null,
    result.totalArmor > 0
      ? {
        id: 'armor',
        icon: symbolIconById.shield,
        value: `+${result.totalArmor}`,
        tone: 'armor',
      }
      : null,
    result.totalTokens > 0
      ? {
        id: 'tokens',
        icon: symbolIconById.coin,
        value: `+${result.totalTokens}`,
        tone: 'tokens',
      }
      : null,
    result.totalHeal > 0
      ? {
        id: 'heal',
        icon: symbolIconById.health_potion,
        value: `+${result.totalHeal}`,
        tone: 'heal',
      }
      : null,
  ].filter((chip): chip is BurstChip => chip !== null)

  return {
    id,
    chips,
    qteTier: result.qte.tier,
    showDamage: result.totalDamage > 0,
    showArmor: result.totalArmor > 0,
    showTokens: result.totalTokens > 0,
    showHeal: result.totalHeal > 0,
  }
}

export default function CombatVfxLayer({
  result,
  zone,
}: CombatVfxLayerProps) {
  const [burst, setBurst] = useState<BurstState | null>(null)
  const burstIdRef = useRef(0)

  useEffect(() => {
    if (!result) {
      return
    }

    burstIdRef.current += 1
    const nextBurst = createBurstState(result, burstIdRef.current)
    setBurst(nextBurst)

    const timeout = window.setTimeout(() => {
      setBurst((current) => (
        current?.id === nextBurst.id ? null : current
      ))
    }, 1150)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [result])

  return (
    <div className={styles.layer} data-zone={zone} aria-hidden="true">
      {burst && (
        <div key={burst.id} className={styles.burst}>
          {burst.showDamage && (
            <>
              <span className={styles.impactCore} />
              <span className={styles.impactRing} />
              <span className={styles.slashPrimary} />
              <span className={styles.slashSecondary} />
            </>
          )}

          {burst.showArmor && <span className={styles.guardRipple} />}
          {burst.showTokens && (
            <>
              <span className={styles.lootSpark} data-index="0" />
              <span className={styles.lootSpark} data-index="1" />
              <span className={styles.lootSpark} data-index="2" />
            </>
          )}
          {burst.showHeal && <span className={styles.healPulse} />}
          {burst.qteTier !== 'miss' && <span className={styles.qteHalo} data-tier={burst.qteTier} />}

          {burst.chips.length > 0 && (
            <div className={styles.chipRail}>
              {burst.chips.map((chip, index) => (
                <span
                  key={`${burst.id}-${chip.id}`}
                  className={styles.chip}
                  data-tone={chip.tone}
                  style={{ '--chip-index': `${index}` } as CSSProperties}
                >
                  <GameIcon
                    icon={chip.icon}
                    alt=""
                    decorative
                    className={styles.chipIcon}
                  />
                  {chip.value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
