import { useCallback, useEffect, useRef, useState } from 'react'
import { haptics } from '@/utils/haptics'
import { useTranslation } from '@/i18n'
import type { QTETier } from '@/types'
import styles from './QTEBar.module.css'

interface QTEBarProps {
  active: boolean
  onResult: (tier: QTETier) => void
}

const ZONES = {
  mega_crit: { start: 0.45, end: 0.55 },
  crit: { start: 0.35, end: 0.65 },
  hit: { start: 0.2, end: 0.8 },
}

const SPEED = 0.0013
const ANIM_DURATION = 3500

export default function QTEBar({ active, onResult }: QTEBarProps) {
  const [markerPos, setMarkerPos] = useState(0)
  const [resolved, setResolved] = useState(false)
  const [flash, setFlash] = useState<QTETier | null>(null)
  const { t } = useTranslation()

  const dirRef = useRef(1)
  const posRef = useRef(0)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const resolve = useCallback((pos: number) => {
    if (resolved) {
      return
    }

    setResolved(true)
    cancelAnimationFrame(rafRef.current)

    let tier: QTETier = 'miss'
    if (pos >= ZONES.mega_crit.start && pos <= ZONES.mega_crit.end) tier = 'mega_crit'
    else if (pos >= ZONES.crit.start && pos <= ZONES.crit.end) tier = 'crit'
    else if (pos >= ZONES.hit.start && pos <= ZONES.hit.end) tier = 'hit'

    if (tier === 'miss') haptics.notifyError()
    else haptics.impactHeavy()

    setFlash(tier)
    setTimeout(() => onResult(tier), 300)
  }, [onResult, resolved])

  useEffect(() => {
    if (!active) {
      setResolved(false)
      setFlash(null)
      posRef.current = 0
      setMarkerPos(0)
      return
    }

    lastTimeRef.current = performance.now()

    function tick(time: number) {
      const delta = time - lastTimeRef.current
      lastTimeRef.current = time

      posRef.current += SPEED * delta * dirRef.current
      if (posRef.current >= 1) {
        posRef.current = 1
        dirRef.current = -1
      }
      if (posRef.current <= 0) {
        posRef.current = 0
        dirRef.current = 1
      }

      setMarkerPos(posRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    const timeout = setTimeout(() => resolve(posRef.current), ANIM_DURATION)
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(timeout)
    }
  }, [active, resolve])

  function handleTap(event: React.SyntheticEvent) {
    event.preventDefault()
    if (!active || resolved) {
      return
    }

    resolve(posRef.current)
  }

  const flashColor: Record<QTETier, string> = {
    miss: '#e05252',
    hit: '#c8a96e',
    crit: '#4caf6e',
    mega_crit: '#f0d090',
  }

  const flashLabel: Record<QTETier, string> = {
    miss: t('qte_label_miss'),
    hit: t('qte_label_hit'),
    crit: t('qte_label_crit'),
    mega_crit: t('qte_label_mega_crit'),
  }

  return (
    <div
      className={`${styles.wrap} ${active && !resolved ? styles.active : ''}`}
      onTouchStart={handleTap}
      onMouseDown={handleTap}
      role="button"
      aria-label={t('tap_qte')}
    >
      <div className={styles.bar}>
        <div
          className={styles.zoneHit}
          style={{ left: `${ZONES.hit.start * 100}%`, width: `${(ZONES.hit.end - ZONES.hit.start) * 100}%` }}
        />
        <div
          className={styles.zoneCrit}
          style={{ left: `${ZONES.crit.start * 100}%`, width: `${(ZONES.crit.end - ZONES.crit.start) * 100}%` }}
        />
        <div
          className={styles.zoneMega}
          style={{ left: `${ZONES.mega_crit.start * 100}%`, width: `${(ZONES.mega_crit.end - ZONES.mega_crit.start) * 100}%` }}
        />

        {!flash && (
          <div className={styles.marker} style={{ left: `${markerPos * 100}%` }} />
        )}
      </div>

      {flash ? (
        <div className={styles.flashLabel} style={{ color: flashColor[flash] }}>
          {flashLabel[flash]}
        </div>
      ) : (
        <div className={styles.hint}>
          {active ? t('qte_tap_hint') : t('qte_wait_hint')}
        </div>
      )}
    </div>
  )
}
