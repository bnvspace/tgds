import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { SafeAreaInset, WebApp as TelegramWebApp } from '@twa-dev/types'
import WebApp from '@twa-dev/sdk'
import styles from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

const EMPTY_INSETS: SafeAreaInset = { top: 0, bottom: 0, left: 0, right: 0 }
const FULLSCREEN_TOP_FALLBACK = 52
const SAFE_AREA_RETRY_DELAYS_MS = [350, 500, 1000] as const

function readLayoutInsets(tg: TelegramWebApp): SafeAreaInset {
  const safe = tg.safeAreaInset ?? EMPTY_INSETS
  const content = tg.contentSafeAreaInset ?? EMPTY_INSETS
  const top = content.top || safe.top || (tg.isFullscreen ? FULLSCREEN_TOP_FALLBACK : 0)

  return {
    top,
    bottom: Math.max(content.bottom, safe.bottom),
    left: Math.max(content.left, safe.left),
    right: Math.max(content.right, safe.right),
  }
}

function areInsetsEqual(a: SafeAreaInset, b: SafeAreaInset) {
  return a.top === b.top
    && a.bottom === b.bottom
    && a.left === b.left
    && a.right === b.right
}

export default function Layout({ children }: LayoutProps) {
  const [insets, setInsets] = useState<SafeAreaInset>(EMPTY_INSETS)
  const timeoutIdsRef = useRef<number[]>([])

  useEffect(() => {
    const tg = WebApp

    function clearScheduledUpdates() {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      timeoutIdsRef.current = []
    }

    function updateInsets() {
      const nextInsets = readLayoutInsets(tg)
      setInsets((currentInsets) => (
        areInsetsEqual(currentInsets, nextInsets) ? currentInsets : nextInsets
      ))
    }

    function scheduleRetryMeasurements() {
      clearScheduledUpdates()
      timeoutIdsRef.current = SAFE_AREA_RETRY_DELAYS_MS.map((delay) => (
        window.setTimeout(updateInsets, delay)
      ))
    }

    function handleFullscreenChanged() {
      updateInsets()
      scheduleRetryMeasurements()
    }

    function handleSafeAreaChanged() {
      updateInsets()
    }

    updateInsets()
    scheduleRetryMeasurements()
    tg.onEvent('fullscreenChanged', handleFullscreenChanged)
    tg.onEvent('safeAreaChanged', handleSafeAreaChanged)
    tg.onEvent('contentSafeAreaChanged', handleSafeAreaChanged)
    window.addEventListener('resize', handleSafeAreaChanged)

    return () => {
      clearScheduledUpdates()
      tg.offEvent('fullscreenChanged', handleFullscreenChanged)
      tg.offEvent('safeAreaChanged', handleSafeAreaChanged)
      tg.offEvent('contentSafeAreaChanged', handleSafeAreaChanged)
      window.removeEventListener('resize', handleSafeAreaChanged)
    }
  }, [])

  return (
    <div
      className={styles.root}
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <div className={styles.frame}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
