import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { GameSymbol } from '@/types'
import type { SlotReelHandle } from '@/components/SlotReel'
import SlotReel from '@/components/SlotReel'
import { useTranslation } from '@/i18n'
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
    const stopInFlightRef = useRef(false)
    const nextStopIndexRef = useRef(0)
    const totalReelsRef = useRef(reels.length)
    const { lang, localizeSymbolName, t } = useTranslation()

    function localizeSymbol(symbol: GameSymbol): GameSymbol {
      return {
        ...symbol,
        name: localizeSymbolName(symbol),
      }
    }

    function resolveSpinIfFinished(nextIndex: number) {
      if (nextIndex >= totalReelsRef.current) {
        resolveSpinRef.current?.()
      }
    }

    function stopCurrentReel() {
      if (!activeSpinRef.current || stopInFlightRef.current) {
        return
      }

      const reelIndex = nextStopIndexRef.current
      const reelRef = reelRefs.current[reelIndex]

      if (!reelRef) {
        return
      }

      stopInFlightRef.current = true

      void reelRef.stop().then(() => {
        const nextIndex = reelIndex + 1
        nextStopIndexRef.current = nextIndex
        stopInFlightRef.current = false

        if (nextIndex >= totalReelsRef.current) {
          resolveSpinIfFinished(nextIndex)
        }
      })
    }

    useImperativeHandle(ref, () => ({
      spinTo: async (results: GameSymbol[]) => {
        if (activeSpinRef.current && spinPromiseRef.current) {
          return spinPromiseRef.current
        }

        activeSpinRef.current = true
        stopInFlightRef.current = false
        totalReelsRef.current = results.length
        nextStopIndexRef.current = 0

        results.forEach((result, index) => {
          reelRefs.current[index]?.startSpin(localizeSymbol(result))
        })

        spinPromiseRef.current = new Promise<void>((resolve) => {
          resolveSpinRef.current = () => {
            activeSpinRef.current = false
            stopInFlightRef.current = false
            spinPromiseRef.current = null
            resolveSpinRef.current = null
            resolve()
          }
        })

        return spinPromiseRef.current
      },

      stopNextReel: () => {
        if (!activeSpinRef.current) {
          return
        }

        if (stopInFlightRef.current) {
          return
        }

        stopCurrentReel()
      },
    }))

    const buttonLabel = isSpinning ? t('stop_button') : t('spin_button')
    const buttonDisabled = isSpinning ? false : disabled
    const reelWidth = reels.length >= 6 ? 48 : reels.length === 5 ? 56 : reels.length === 4 ? 64 : 72
    const reelGap = reels.length >= 6 ? 4 : reels.length === 5 ? 5 : 6
    const reelRowStyle = {
      '--reel-width': `${reelWidth}px`,
      '--reel-gap': `${reelGap}px`,
    } as CSSProperties

    return (
      <div className={styles.wrap}>
        <div className={styles.reelsRow} style={reelRowStyle}>
          {reels.map((reel, index) => {
            const localizedPool = reel.symbolPool.map((weightedSymbol) => localizeSymbol(weightedSymbol.symbol))

            return (
              <SlotReel
                key={index}
                ref={(element) => {
                  reelRefs.current[index] = element
                }}
                labelVersion={lang}
                symbolPool={localizedPool}
                initialSymbol={localizedPool[0]}
              />
            )
          })}
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
