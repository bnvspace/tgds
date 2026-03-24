import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import type { GameSymbol } from '@/types'
import { SYMBOL_LIBRARY } from '@/game/symbols'
import { haptics } from '@/utils/haptics'
import styles from './SlotReel.module.css'

const SYM_H = 80          // px per symbol cell
const VISIBLE = 3         // cells in window (top | CENTER=result | bottom)
const WIN_H = SYM_H * VISIBLE

// Symbol pool to tile the strip for continuous scrolling
const TILE_COUNT = 6       // how many full pool repetitions before result
const OVERSHOOT_PX = 10   // px overshoot for bounce

// ── Easing helpers ────────────────────────────────────────
function easeInQuad(t: number) { return t * t }
function easeOutBack(t: number, s = 1.2) {
  return (1 + s) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2) + 1
}

/**
 * Multi-phase reel easing:
 * 0.00 → 0.20  ramp-up   (easeInQuad)
 * 0.20 → 0.70  fast spin (linear)
 * 0.70 → 1.00  brake     (easeOutBack → snap with small overshoot reversed)
 */
function reelEase(t: number): number {
  if (t < 0.2) return easeInQuad(t / 0.2) * 0.2
  if (t < 0.7) return 0.2 + ((t - 0.2) / 0.5) * 0.5
  const brake = (t - 0.7) / 0.3
  return 0.7 + easeOutBack(brake, 0.15) * 0.3
}

// ── Strip builder ─────────────────────────────────────────
function buildStrip(pool: GameSymbol[], result: GameSymbol): GameSymbol[] {
  const strip: GameSymbol[] = []
  for (let i = 0; i < TILE_COUNT; i++) {
    // shuffle pool order each tile pass so it looks random
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    strip.push(...shuffled)
  }
  // Make sure result is the last symbol (index strip.length after push)
  strip.push(result)
  // Add a few after result so it doesn't look cut off
  strip.push(...pool.slice(0, 2))
  return strip
}

// Target translateY so result (at resultIndex) is in the center of the window
function finalY(resultIndex: number): number {
  // Center of window = SYM_H (the middle cell top)
  // Center of result cell = resultIndex * SYM_H + SYM_H/2
  // We want: stripTop + translateY + resultCenter = window center
  // translateY = WIN_H/2 - SYM_H/2 - resultIndex * SYM_H
  return WIN_H / 2 - SYM_H / 2 - resultIndex * SYM_H
}

// ── Component ─────────────────────────────────────────────
export interface SlotReelHandle {
  spin: (result: GameSymbol, delay: number) => Promise<void>
}

interface SlotReelProps {
  symbolPool: GameSymbol[]
  initialSymbol?: GameSymbol
}

const TYPE_COLOR: Record<string, string> = {
  damage: '#e05252',
  defense: '#4caf6e',
  economy: '#c8a96e',
  special: '#9b72cf',
}

const SlotReel = forwardRef<SlotReelHandle, SlotReelProps>(
  ({ symbolPool, initialSymbol }, ref) => {
    const stripRef = useRef<HTMLDivElement>(null)
    const symbolsRef = useRef<GameSymbol[]>([])
    const currentYRef = useRef(0)

    // Start with initial symbol centered
    useEffect(() => {
      if (!stripRef.current) return
      const initial = initialSymbol ?? symbolPool[0]
      symbolsRef.current = [symbolPool[symbolPool.length - 1], initial, symbolPool[0]]
      renderStrip(symbolsRef.current)
      const y = finalY(1) // index 1 = center
      currentYRef.current = y
      stripRef.current.style.transform = `translateY(${y}px)`
    }, [])

    function renderStrip(syms: GameSymbol[]) {
      if (!stripRef.current) return
      stripRef.current.innerHTML = ''
      for (const sym of syms) {
        const cell = document.createElement('div')
        cell.className = styles.cell
        cell.innerHTML = `
          <span class="${styles.icon}">${sym.icon}</span>
          <span class="${styles.name}" style="color:${TYPE_COLOR[sym.type]}">${sym.name}</span>
        `
        stripRef.current.appendChild(cell)
      }
    }

    // Expose spin() to parent
    useImperativeHandle(ref, () => ({
      spin: (result: GameSymbol, delay: number) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            if (!stripRef.current) return resolve()

            // Build a long strip ending with result
            const strip = buildStrip(symbolPool, result)
            symbolsRef.current = strip
            renderStrip(strip)

            const resultIndex = strip.length - 3 // result is index TILE_COUNT * pool.length
            const targetY = finalY(resultIndex)
            const startY = finalY(1)            // start showing first symbol
            const totalDist = Math.abs(targetY - startY)
            const duration = 1800              // ms for this reel

            stripRef.current.style.transform = `translateY(${startY}px)`
            currentYRef.current = startY

            let startTime: number | null = null

            function tick(now: number) {
              if (!startTime) startTime = now
              const elapsed = now - startTime
              const t = Math.min(elapsed / duration, 1)
              const eased = reelEase(t)

              // Spin goes UP (negative Y direction)
              const y = startY - totalDist * eased
              if (stripRef.current) {
                stripRef.current.style.transform = `translateY(${y}px)`
              }
              currentYRef.current = y

              if (t < 1) {
                requestAnimationFrame(tick)
              } else {
                // Overshoot → snap back
                const overshootY = targetY - OVERSHOOT_PX
                if (stripRef.current) {
                  stripRef.current.style.transition = `transform 80ms ease-in`
                  stripRef.current.style.transform = `translateY(${overshootY}px)`
                }
                setTimeout(() => {
                  if (stripRef.current) {
                    stripRef.current.style.transition = `transform 120ms ease-out`
                    stripRef.current.style.transform = `translateY(${targetY}px)`
                    currentYRef.current = targetY
                  }
                  setTimeout(() => {
                    if (stripRef.current) stripRef.current.style.transition = ''
                    resolve()
                  }, 130)
                }, 90)
              }
            }

            requestAnimationFrame(tick)
          }, delay)
        })
      },
    }))

    return (
      <div className={styles.window}>
        {/* Center line highlight */}
        <div className={styles.centerLine} />
        <div ref={stripRef} className={styles.strip} />
      </div>
    )
  }
)

SlotReel.displayName = 'SlotReel'
export default SlotReel
