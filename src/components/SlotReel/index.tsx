import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { GameSymbol, TimingTier } from '@/types'
import { createGameIconNode } from '@/utils/gameIcon'
import { haptics } from '@/utils/haptics'
import styles from './SlotReel.module.css'

const SYM_H = 80
const VISIBLE = 3
const WIN_H = SYM_H * VISIBLE

const LOOP_REPEATS = 14
const START_REPEAT_INDEX = 3
const MAX_REPEAT_INDEX = LOOP_REPEATS - 3
const SPIN_SPEED_PX_PER_MS = 0.96
const STOP_LEAD_CELLS = 9
const STOP_FILLER_CELLS = 9
const STOP_DURATION_MS = 520
const OVERSHOOT_PX = 3

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function brakeEase(t: number) {
  if (t < 0.35) {
    return (t / 0.35) * 0.55
  }

  const brakePhase = (t - 0.35) / 0.65
  return 0.55 + easeOutCubic(brakePhase) * 0.45
}

function finalTranslate(targetIndex: number): number {
  return WIN_H / 2 - SYM_H / 2 - targetIndex * SYM_H
}

function pickLoopBase(pool: GameSymbol[]): GameSymbol[] {
  if (pool.length <= 1) return [...pool]
  return [...pool].sort(() => Math.random() - 0.5)
}

function buildLoopStrip(base: GameSymbol[]): GameSymbol[] {
  return Array.from({ length: LOOP_REPEATS }, () => base).flat()
}

function buildStopStrip(
  loopSymbols: GameSymbol[],
  topIndex: number,
  pool: GameSymbol[],
  result: GameSymbol,
) {
  const safeTopIndex = Math.max(0, topIndex)
  const leading = loopSymbols.slice(safeTopIndex, safeTopIndex + STOP_LEAD_CELLS)
  const filler = Array.from({ length: STOP_FILLER_CELLS }, (_, index) => (
    pool[(safeTopIndex + index) % pool.length] ?? result
  ))
  const resultIndex = leading.length + filler.length

  return {
    strip: [...leading, ...filler, result, ...pool.slice(0, 2)],
    resultIndex,
  }
}

export interface ReelStopResult {
  offset: number  // normalized 0..1 distance from ideal position
}

export interface SlotReelHandle {
  startSpin: (result: GameSymbol) => void
  stop: () => Promise<ReelStopResult>
  flashTiming: (tier: TimingTier) => void
}

interface SlotReelProps {
  symbolPool: GameSymbol[]
  initialSymbol?: GameSymbol
  labelVersion?: string
}

const TYPE_COLOR: Record<string, string> = {
  damage: '#e05252',
  defense: '#4caf6e',
  economy: '#c8a96e',
  special: '#9b72cf',
}

const SlotReel = forwardRef<SlotReelHandle, SlotReelProps>(
  ({ symbolPool, initialSymbol, labelVersion }, ref) => {
    const windowRef = useRef<HTMLDivElement>(null)
    const stripRef = useRef<HTMLDivElement>(null)
    const loopBaseRef = useRef<GameSymbol[]>([])
    const loopSymbolsRef = useRef<GameSymbol[]>([])
    const pendingResultRef = useRef<GameSymbol | null>(null)
    const currentOffsetRef = useRef(0)
    const lastFrameRef = useRef<number | null>(null)
    const lastBoundaryRef = useRef(0)
    const spinningRef = useRef(false)
    const rafRef = useRef<number | null>(null)
    const symbolPoolRef = useRef(symbolPool)
    const initialSymbolRef = useRef(initialSymbol)
    const symbolPoolKey = symbolPool.map((symbol) => `${symbol.id}:${symbol.name}`).join('|')
    const initialSymbolKey = initialSymbol ? `${initialSymbol.id}:${initialSymbol.name}` : ''

    function renderStrip(symbols: GameSymbol[]) {
      if (!stripRef.current) return

      stripRef.current.replaceChildren()
      for (const symbol of symbols) {
        if (!symbol) continue
        const cell = document.createElement('div')
        cell.className = styles.cell

        const iconNode = createGameIconNode({
          icon: symbol.icon || '?',
          alt: symbol.name || 'symbol',
          className: styles.icon,
        })

        const nameNode = document.createElement('span')
        nameNode.className = styles.name
        nameNode.style.color = TYPE_COLOR[symbol.type] || '#fff'
        nameNode.textContent = symbol.name || ''

        cell.appendChild(iconNode)
        cell.appendChild(nameNode)
        stripRef.current.appendChild(cell)
      }
    }

    function applyTranslate(y: number) {
      if (!stripRef.current) return
      stripRef.current.style.transform = `translateY(${y}px)`
    }

    useEffect(() => {
      symbolPoolRef.current = symbolPool
      initialSymbolRef.current = initialSymbol
    }, [initialSymbol, symbolPool])

    useEffect(() => {
      const pool = symbolPoolRef.current
      const leadingSymbol = pool[0]
      const trailingSymbol = pool[pool.length - 1]
      const initialEntry = initialSymbolRef.current ?? pool[0]

      if (!stripRef.current || pool.length === 0 || !leadingSymbol || !trailingSymbol || !initialEntry) {
        return
      }

      renderStrip([trailingSymbol, initialEntry, leadingSymbol])
      applyTranslate(finalTranslate(1))

      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
        }
      }
    }, [initialSymbolKey, labelVersion, symbolPool.length, symbolPoolKey])

    function runLoop(now: number) {
      if (!spinningRef.current || loopBaseRef.current.length === 0) return

      if (lastFrameRef.current === null) {
        lastFrameRef.current = now
      }

      const delta = now - lastFrameRef.current
      lastFrameRef.current = now

      const cyclePx = loopBaseRef.current.length * SYM_H
      const minOffset = cyclePx * START_REPEAT_INDEX
      const maxOffset = cyclePx * MAX_REPEAT_INDEX

      currentOffsetRef.current += delta * SPIN_SPEED_PX_PER_MS
      if (currentOffsetRef.current >= maxOffset) {
        currentOffsetRef.current -= cyclePx * 2
        if (currentOffsetRef.current < minOffset) {
          currentOffsetRef.current += cyclePx
        }
      }

      applyTranslate(-currentOffsetRef.current)

      const boundary = Math.floor(currentOffsetRef.current / SYM_H)
      if (boundary > lastBoundaryRef.current) {
        lastBoundaryRef.current = boundary
        haptics.reelTick()
      }

      rafRef.current = requestAnimationFrame(runLoop)
    }

    /**
     * Compute how far the current offset is from ideal cell alignment.
     * Returns normalized 0..1 where 0 = perfectly centered, 0.5 = worst.
     */
    function computeStopOffset(): number {
      const offsetWithinCell = currentOffsetRef.current % SYM_H
      // 0 = perfectly aligned, SYM_H/2 = worst position
      const distanceFromCenter = Math.abs(offsetWithinCell - SYM_H / 2)
      // Normalize: 0 when perfectly on cell center, 1 when at cell boundary
      // But we want 0 = perfect = hit the center, so invert
      const normalizedFromIdeal = distanceFromCenter / (SYM_H / 2)
      return normalizedFromIdeal
    }

    useImperativeHandle(ref, () => ({
      startSpin: (result: GameSymbol) => {
        if (!stripRef.current || symbolPool.length === 0) return

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
        }

        // Clear any timing flash
        if (windowRef.current) {
          windowRef.current.classList.remove(styles.stopPerfect, styles.stopGood)
        }

        const loopBase = pickLoopBase(symbolPool)
        const loopSymbols = buildLoopStrip(loopBase)
        const cyclePx = loopBase.length * SYM_H

        loopBaseRef.current = loopBase
        loopSymbolsRef.current = loopSymbols
        pendingResultRef.current = result
        currentOffsetRef.current = cyclePx * START_REPEAT_INDEX
        lastFrameRef.current = null
        lastBoundaryRef.current = Math.floor(currentOffsetRef.current / SYM_H)
        spinningRef.current = true

        renderStrip(loopSymbols)
        if (stripRef.current) {
          stripRef.current.style.transition = ''
        }
        applyTranslate(-currentOffsetRef.current)
        rafRef.current = requestAnimationFrame(runLoop)
      },

      stop: () => new Promise<ReelStopResult>((resolve) => {
        if (!stripRef.current || !pendingResultRef.current || !spinningRef.current) {
          resolve({ offset: 1 })
          return
        }

        // Capture timing offset BEFORE stopping
        const stopOffset = computeStopOffset()

        spinningRef.current = false
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }

        const topIndex = Math.floor(currentOffsetRef.current / SYM_H)
        const offsetWithinCell = currentOffsetRef.current % SYM_H
        const { strip, resultIndex } = buildStopStrip(
          loopSymbolsRef.current,
          topIndex,
          symbolPool,
          pendingResultRef.current,
        )

        renderStrip(strip)

        const startY = -offsetWithinCell
        const targetY = finalTranslate(resultIndex)
        applyTranslate(startY)

        let startTime: number | null = null
        let lastStopBoundary = 0

        function tick(now: number) {
          if (startTime === null) {
            startTime = now
          }

          const elapsed = now - startTime
          const progress = Math.min(elapsed / STOP_DURATION_MS, 1)
          const eased = brakeEase(progress)
          const y = startY + (targetY - startY) * eased

          applyTranslate(y)

          const traveled = Math.abs(y - startY)
          const boundary = Math.floor(traveled / SYM_H)
          if (boundary > lastStopBoundary) {
            lastStopBoundary = boundary
            haptics.reelTick()
          }

          if (progress < 1) {
            requestAnimationFrame(tick)
            return
          }

          haptics.reelLand()
          if (stripRef.current) {
            stripRef.current.style.transition = 'transform 65ms ease-in'
            stripRef.current.style.transform = `translateY(${targetY - OVERSHOOT_PX}px)`
          }

          setTimeout(() => {
            if (stripRef.current) {
              stripRef.current.style.transition = 'transform 120ms ease-out'
              stripRef.current.style.transform = `translateY(${targetY}px)`
            }

            setTimeout(() => {
              if (stripRef.current) {
                stripRef.current.style.transition = ''
              }
              resolve({ offset: stopOffset })
            }, 120)
          }, 65)
        }

        requestAnimationFrame(tick)
      }),

      flashTiming: (tier: TimingTier) => {
        if (!windowRef.current) return
        const el = windowRef.current

        // Remove any previous flash
        el.classList.remove(styles.stopPerfect, styles.stopGood)
        // Force reflow to re-trigger animation
        void el.offsetWidth

        if (tier === 'perfect') {
          el.classList.add(styles.stopPerfect)
        } else if (tier === 'good') {
          el.classList.add(styles.stopGood)
        }
      },
    }))

    return (
      <div ref={windowRef} className={styles.window}>
        <div className={styles.centerLine} />
        <div ref={stripRef} className={styles.strip} />
      </div>
    )
  },
)

SlotReel.displayName = 'SlotReel'
export default SlotReel
