import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { GameSymbol, TimingTier } from '@/types'
import type { SlotReelHandle, ReelStopResult } from '@/components/SlotReel'
import SlotReel from '@/components/SlotReel'
import { useTranslation } from '@/i18n'
import styles from './SlotMachine.module.css'

interface SlotMachineProps {
  reelCount: number
  symbolPool: GameSymbol[]
  isSpinning: boolean
  onSpin: () => void
  disabled?: boolean
}

export interface SlotMachineHandle {
  spinTo: (results: GameSymbol[]) => Promise<void>
  stopNextReel: () => Promise<ReelStopResult | null>
  flashReelTiming: (reelIndex: number, tier: TimingTier) => void
}

const SlotMachine = forwardRef<SlotMachineHandle, SlotMachineProps>(
  ({ reelCount, symbolPool, isSpinning, onSpin, disabled }, ref) => {
    const reelRefs = useRef<(SlotReelHandle | null)[]>([])
    const spinPromiseRef = useRef<Promise<void> | null>(null)
    const resolveSpinRef = useRef<(() => void) | null>(null)
    const activeSpinRef = useRef(false)
    const stopInFlightRef = useRef(false)
    const nextStopIndexRef = useRef(0)
    const totalReelsRef = useRef(reelCount)
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

    async function stopCurrentReel(): Promise<ReelStopResult | null> {
      if (!activeSpinRef.current || stopInFlightRef.current) {
        return null
      }

      const reelIndex = nextStopIndexRef.current
      const reelRef = reelRefs.current[reelIndex]

      if (!reelRef) {
        return null
      }

      stopInFlightRef.current = true

      const result = await reelRef.stop()
      const nextIndex = reelIndex + 1
      nextStopIndexRef.current = nextIndex
      stopInFlightRef.current = false

      if (nextIndex >= totalReelsRef.current) {
        resolveSpinIfFinished(nextIndex)
      }

      return result
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

      stopNextReel: async (): Promise<ReelStopResult | null> => {
        if (!activeSpinRef.current) {
          return null
        }

        if (stopInFlightRef.current) {
          return null
        }

        return stopCurrentReel()
      },

      flashReelTiming: (reelIndex: number, tier: TimingTier) => {
        reelRefs.current[reelIndex]?.flashTiming(tier)
      },
    }))

    const buttonLabel = isSpinning ? t('stop_button') : t('spin_button')
    const buttonDisabled = isSpinning ? false : disabled
    const reelWidth = reelCount >= 6 ? 48 : reelCount === 5 ? 56 : reelCount === 4 ? 64 : 72
    const reelGap = reelCount >= 6 ? 4 : reelCount === 5 ? 5 : 6
    const reelRowStyle = {
      '--reel-width': `${reelWidth}px`,
      '--reel-gap': `${reelGap}px`,
    } as CSSProperties

    return (
      <div className={styles.wrap}>
        <div className={styles.reelsRow} style={reelRowStyle}>
          {Array.from({ length: reelCount }, (_, index) => {
            const localizedPool = symbolPool.map((symbol) => localizeSymbol(symbol))

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
