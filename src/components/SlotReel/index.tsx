import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import type { GameSymbol } from '@/types'
import { haptics } from '@/utils/haptics'
import styles from './SlotReel.module.css'

const SYM_H = 80
const VISIBLE = 3
const WIN_H = SYM_H * VISIBLE

const TILE_COUNT = 6
const BASE_SPIN_MS = 1120
const OVERSHOOT_PX = 6

function easeInQuad(t: number) {
  return t * t
}

function easeOutBack(t: number, s = 0.08) {
  return (1 + s) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2) + 1
}

function reelEase(t: number): number {
  if (t < 0.18) return easeInQuad(t / 0.18) * 0.18
  if (t < 0.72) return 0.18 + ((t - 0.18) / 0.54) * 0.54
  const brake = (t - 0.72) / 0.28
  return 0.72 + easeOutBack(brake) * 0.28
}

function buildStrip(pool: GameSymbol[], result: GameSymbol): GameSymbol[] {
  const strip: GameSymbol[] = []
  strip.push(...pool.slice(0, 2))
  strip.push(result)

  for (let i = 0; i < TILE_COUNT; i++) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    strip.push(...shuffled)
  }

  return strip
}

function finalY(resultIndex: number): number {
  return WIN_H / 2 - SYM_H / 2 - resultIndex * SYM_H
}

export interface SlotReelHandle {
  spin: (result: GameSymbol, stopOffsetMs: number) => Promise<void>
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

    useEffect(() => {
      if (!stripRef.current) return

      const initial = initialSymbol ?? symbolPool[0]
      symbolsRef.current = [symbolPool[symbolPool.length - 1], initial, symbolPool[0]]
      renderStrip(symbolsRef.current)

      const y = finalY(1)
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

    useImperativeHandle(ref, () => ({
      spin: (result: GameSymbol, stopOffsetMs: number) => {
        return new Promise<void>((resolve) => {
          try {
            if (!stripRef.current || !symbolPool || symbolPool.length === 0) {
              console.error('SlotReel: stripRef or symbolPool is invalid', { strip: stripRef.current, symbolPool })
              return resolve()
            }

            const strip = buildStrip(symbolPool, result)
            symbolsRef.current = strip
            renderStrip(strip)

            const resultIndex = 2
            const startIndex = strip.length - 2
            const targetY = finalY(resultIndex)
            const startY = finalY(startIndex)
            const totalDist = targetY - startY
            const duration = BASE_SPIN_MS + stopOffsetMs

            stripRef.current.style.transform = `translateY(${startY}px)`
            currentYRef.current = startY

            let startTime: number | null = null
            let lastSymbolIndex = 0

            function tick(now: number) {
              if (!startTime) startTime = now
              const elapsed = now - startTime
              const t = Math.min(elapsed / duration, 1)
              const eased = reelEase(t)

              const y = startY + totalDist * eased
              if (stripRef.current) {
                stripRef.current.style.transform = `translateY(${y}px)`
              }
              currentYRef.current = y

              const distTraveled = Math.abs(y - startY)
              const symIndex = Math.floor(distTraveled / SYM_H)
              if (symIndex > lastSymbolIndex) {
                lastSymbolIndex = symIndex
                haptics.reelTick()
              }

              if (t < 1) {
                requestAnimationFrame(tick)
                return
              }

              haptics.reelLand()
              const overshootY = targetY + OVERSHOOT_PX
              if (stripRef.current) {
                stripRef.current.style.transition = 'transform 70ms ease-in'
                stripRef.current.style.transform = `translateY(${overshootY}px)`
              }

              setTimeout(() => {
                if (stripRef.current) {
                  stripRef.current.style.transition = 'transform 110ms ease-out'
                  stripRef.current.style.transform = `translateY(${targetY}px)`
                  currentYRef.current = targetY
                }

                setTimeout(() => {
                  if (stripRef.current) stripRef.current.style.transition = ''
                  resolve()
                }, 120)
              }, 70)
            }

            requestAnimationFrame(tick)
          } catch (error) {
            console.error('Reel spin error:', error)
            resolve()
          }
        })
      },
    }))

    return (
      <div className={styles.window}>
        <div className={styles.centerLine} />
        <div ref={stripRef} className={styles.strip} />
      </div>
    )
  },
)

SlotReel.displayName = 'SlotReel'
export default SlotReel
