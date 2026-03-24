import { useRef } from 'react'
import type { GameSymbol } from '@/types'
import type { SlotReelHandle } from '@/components/SlotReel'
import SlotReel from '@/components/SlotReel'
import styles from './SlotMachine.module.css'

interface SlotMachineProps {
  reels: Array<{ symbolPool: Array<{ symbol: GameSymbol; weight: number }> }>
  isSpinning: boolean
  onSpin: () => void
  disabled?: boolean
}

// Expose spin method so parent can trigger via ref
export interface SlotMachineHandle {
  spinTo: (results: GameSymbol[]) => Promise<void>
}

import { forwardRef, useImperativeHandle } from 'react'

const STAGGER_MS = 250  // ms between reel starts

const SlotMachine = forwardRef<SlotMachineHandle, SlotMachineProps>(
  ({ reels, isSpinning, onSpin, disabled }, ref) => {
    const reelRefs = useRef<(SlotReelHandle | null)[]>([])

    useImperativeHandle(ref, () => ({
      spinTo: async (results: GameSymbol[]) => {
        // Launch all reels with staggered delays, wait for last to finish
        const promises = results.map((result, i) => {
          const reelRef = reelRefs.current[i]
          if (!reelRef) return Promise.resolve()
          return reelRef.spin(result, i * STAGGER_MS)
        })
        await Promise.all(promises)
      },
    }))

    return (
      <div className={styles.wrap}>
        {/* Reels row */}
        <div className={styles.reelsRow}>
          {reels.map((reel, i) => (
            <SlotReel
              key={i}
              ref={(el) => { reelRefs.current[i] = el }}
              symbolPool={reel.symbolPool.map((ws) => ws.symbol)}
              initialSymbol={reel.symbolPool[0]?.symbol}
            />
          ))}
        </div>

        {/* SPIN button */}
        <button
          id="slot-spin-btn"
          className={`${styles.spinBtn} ${isSpinning ? styles.spinning : ''}`}
          onClick={onSpin}
          disabled={disabled || isSpinning}
        >
          {isSpinning ? '· · ·' : '▶ SPIN'}
        </button>
      </div>
    )
  }
)

SlotMachine.displayName = 'SlotMachine'
export default SlotMachine
