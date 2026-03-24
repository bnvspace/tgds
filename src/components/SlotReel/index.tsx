import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import type { GameSymbol } from '@/types'
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
  // Symbols move DOWN visually, which means the strip translates UP in Y coordinate.
  // We want to END on the result (at index 2) and START at the bottom (index strip.length - 2)
  strip.push(...pool.slice(0, 2))
  strip.push(result)
  for (let i = 0; i < TILE_COUNT; i++) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    strip.push(...shuffled)
  }
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
        if (!sym) continue
        const cell = document.createElement('div')
        cell.className = styles.cell
        cell.innerHTML = `
          <span class="${styles.icon || ''}">${sym.icon || '?'}</span>
          <span class="${styles.name || ''}" style="color:${TYPE_COLOR[sym.type] || '#fff'}">${sym.name || ''}</span>
        `
        stripRef.current.appendChild(cell)
      }
    }

    // Expose spin() to parent
    useImperativeHandle(ref, () => ({
      spin: (result: GameSymbol, delay: number) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            try {
              if (!stripRef.current || !symbolPool || symbolPool.length === 0) {
                console.error('SlotReel: stripRef or symbolPool is invalid', { strip: stripRef.current, symbolPool })
                return resolve()
              }

              // Build a long strip where result is near the top
              const strip = buildStrip(symbolPool, result)
              symbolsRef.current = strip
              renderStrip(strip)

              const resultIndex = 2 // result is at index 2
              const startIndex = strip.length - 2
              const targetY = finalY(resultIndex)
              const startY = finalY(startIndex)   // start showing from bottom
              const totalDist = targetY - startY // Positive distance (goes UP mathematically, DOWN visually)
              const duration = 1250              // ms for this reel

              stripRef.current.style.transform = `translateY(${startY}px)`
              currentYRef.current = startY

              let startTime: number | null = null
              let lastSymbolIndex = 0 // track reel ticks for haptic

              function tick(now: number) {
                if (!startTime) startTime = now
                const elapsed = now - startTime
                const t = Math.min(elapsed / duration, 1)
                const eased = reelEase(t)

                // Spin visually goes DOWN (positive Y direction increase)
                const y = startY + totalDist * eased
                if (stripRef.current) {
                  stripRef.current.style.transform = `translateY(${y}px)`
                }
                currentYRef.current = y

                // Haptic reel tick: vibrate each time a symbol passes
                const distTraveled = Math.abs(y - startY)
                const symIndex = Math.floor(distTraveled / SYM_H)
                if (symIndex > lastSymbolIndex) {
                  lastSymbolIndex = symIndex
                  haptics.reelTick()
                }

                if (t < 1) {
                  requestAnimationFrame(tick)
                } else {
                  // Overshoot → snap back
                  haptics.reelLand()
                  const overshootY = targetY + OVERSHOOT_PX
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
            } catch (error) {
              console.error('Reel spin error:', error)
              resolve() // MUST resolve to prevent hang
            }
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
