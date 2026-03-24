import { useEffect, useRef, useState, useCallback } from 'react'
import { haptics } from '@/utils/haptics'
import type { QTETier } from '@/types'
import styles from './QTEBar.module.css'

interface QTEBarProps {
  active: boolean
  onResult: (tier: QTETier) => void
}

// Zone boundaries (0..1 of bar width)
const ZONES = {
  mega_crit: { start: 0.45, end: 0.55 },   // center 10% — gold
  crit:      { start: 0.35, end: 0.65 },   // center 30% — green
  hit:       { start: 0.2,  end: 0.8  },   // center 60% — yellow
  // rest = miss — red
}

const SPEED = 0.0013       // fraction per ms (замедлено для играбельности)
const ANIM_DURATION = 3500 // ms before auto-miss

export default function QTEBar({ active, onResult }: QTEBarProps) {
  const [markerPos, setMarkerPos] = useState(0)   // 0..1
  const [resolved, setResolved] = useState(false)
  const [flash, setFlash] = useState<QTETier | null>(null)

  const dirRef = useRef(1)
  const posRef = useRef(0)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const resolve = useCallback(
    (pos: number) => {
      if (resolved) return
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
    },
    [resolved, onResult]
  )

  // Start animation when active
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
      const dt = time - lastTimeRef.current
      lastTimeRef.current = time

      posRef.current += SPEED * dt * dirRef.current
      if (posRef.current >= 1) { posRef.current = 1; dirRef.current = -1 }
      if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1 }

      setMarkerPos(posRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    // Auto-miss after ANIM_DURATION
    const timeout = setTimeout(() => resolve(posRef.current), ANIM_DURATION)
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(timeout)
    }
  }, [active, resolve])

  function handleTap(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!active || resolved) return
    resolve(posRef.current)
  }

  const FLASH_COLOR: Record<QTETier, string> = {
    miss: '#e05252',
    hit: '#c8a96e',
    crit: '#4caf6e',
    mega_crit: '#f0d090',
  }
  const FLASH_LABEL: Record<QTETier, string> = {
    miss: 'MISS',
    hit: 'HIT ×1.5',
    crit: 'CRIT ×2',
    mega_crit: '★ MEGA ×3',
  }

  return (
    <div
      className={`${styles.wrap} ${active && !resolved ? styles.active : ''}`}
      onTouchStart={handleTap}
      onMouseDown={handleTap}
      role="button"
      aria-label="QTE timing bar — tap at the right moment"
    >
      {/* Zone highlights */}
      <div className={styles.bar}>
        <div className={styles.zoneHit}
          style={{ left: `${ZONES.hit.start * 100}%`, width: `${(ZONES.hit.end - ZONES.hit.start) * 100}%` }} />
        <div className={styles.zoneCrit}
          style={{ left: `${ZONES.crit.start * 100}%`, width: `${(ZONES.crit.end - ZONES.crit.start) * 100}%` }} />
        <div className={styles.zoneMega}
          style={{ left: `${ZONES.mega_crit.start * 100}%`, width: `${(ZONES.mega_crit.end - ZONES.mega_crit.start) * 100}%` }} />

        {/* Moving marker */}
        {!flash && (
          <div
            className={styles.marker}
            style={{ left: `${markerPos * 100}%` }}
          />
        )}
      </div>

      {/* Label */}
      {flash ? (
        <div className={styles.flashLabel} style={{ color: FLASH_COLOR[flash] }}>
          {FLASH_LABEL[flash]}
        </div>
      ) : (
        <div className={styles.hint}>
          {active ? '▶ TAP!' : 'SPIN to start'}
        </div>
      )}
    </div>
  )
}
