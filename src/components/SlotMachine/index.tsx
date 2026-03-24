import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
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

export interface SlotMachineHandle {
  spinTo: (results: GameSymbol[]) => Promise<void>
  stopNextReel: () => void
}

const SlotMachine = forwardRef<SlotMachineHandle, SlotMachineProps>(
  ({ reels, isSpinning, onSpin, disabled }, ref) => {
    const reelRefs = useRef<(SlotReelHandle | null)[]>([])
    const spinPromiseRef = useRef<Promise<void> | null>(null)
    const resolveSpinRef = useRef<(() => void) | null>(null)
    const activeSpinRef = useRef(false)
    const stopLockedRef = useRef(false)
    const nextStopIndexRef = useRef(0)
    const totalReelsRef = useRef(reels.length)
    const [nextStopIndex, setNextStopIndex] = useState(0)
    const [stopLocked, setStopLocked] = useState(false)

    useImperativeHandle(ref, () => ({
      spinTo: async (results: GameSymbol[]) => {
        if (activeSpinRef.current && spinPromiseRef.current) {
          return spinPromiseRef.current
        }

        activeSpinRef.current = true
        stopLockedRef.current = false
        totalReelsRef.current = results.length
        nextStopIndexRef.current = 0
        setNextStopIndex(0)
        setStopLocked(false)

        results.forEach((result, index) => {
          reelRefs.current[index]?.startSpin(result)
        })

        spinPromiseRef.current = new Promise<void>((resolve) => {
          resolveSpinRef.current = () => {
            activeSpinRef.current = false
            stopLockedRef.current = false
            spinPromiseRef.current = null
            resolveSpinRef.current = null
            setNextStopIndex(totalReelsRef.current)
            setStopLocked(false)
            resolve()
          }
        })

        return spinPromiseRef.current
      },

      stopNextReel: () => {
        if (!activeSpinRef.current || stopLockedRef.current) return

        const reelIndex = nextStopIndexRef.current
        const reelRef = reelRefs.current[reelIndex]
        if (!reelRef) return

        stopLockedRef.current = true
        setStopLocked(true)

        void reelRef.stop().then(() => {
          const nextIndex = reelIndex + 1
          nextStopIndexRef.current = nextIndex
          setNextStopIndex(nextIndex)
          stopLockedRef.current = false
          setStopLocked(false)

          if (nextIndex >= totalReelsRef.current) {
            resolveSpinRef.current?.()
          }
        })
      },
    }))

    const buttonLabel = isSpinning
      ? nextStopIndex >= reels.length
        ? '...'
        : `STOP ${nextStopIndex + 1}`
      : 'SPIN'

    const buttonDisabled = isSpinning ? stopLocked : disabled

    return (
      <div className={styles.wrap}>
        <div className={styles.reelsRow}>
          {reels.map((reel, index) => (
            <SlotReel
              key={index}
              ref={(element) => {
                reelRefs.current[index] = element
              }}
              symbolPool={reel.symbolPool.map((weightedSymbol) => weightedSymbol.symbol)}
              initialSymbol={reel.symbolPool[0]?.symbol}
            />
          ))}
        </div>

        <button
          id="slot-spin-btn"
          className={`${styles.spinBtn} ${isSpinning ? styles.spinning : ''}`}
          onClick={onSpin}
          disabled={buttonDisabled}
        >
          {buttonLabel}
        </button>
      </div>
    )
  },
)

SlotMachine.displayName = 'SlotMachine'
export default SlotMachine
