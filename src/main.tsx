import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { EventParams, SafeAreaInset, Telegram, WebApp as TelegramWebApp } from '@twa-dev/types'
import App from './App'
import './styles/global.css'

const TELEGRAM_BG = '#0a0a0f'
const VIEWPORT_RETRY_DELAYS_MS = [350, 500, 1000] as const
const EMPTY_INSETS: SafeAreaInset = { top: 0, bottom: 0, left: 0, right: 0 }

function setCssVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value)
}

function getTelegramWebApp(): TelegramWebApp | null {
  const candidate = (window as Window & { Telegram?: Telegram }).Telegram?.WebApp
  return candidate ?? null
}

function readViewportHeight() {
  return Math.max(
    window.innerHeight || 0,
    document.documentElement.clientHeight || 0,
    document.body?.clientHeight || 0,
  )
}

function syncInsetVars(
  prefix: '--tg-safe-area' | '--tg-content-safe-area',
  inset: SafeAreaInset | undefined,
) {
  const nextInset = inset ?? EMPTY_INSETS

  setCssVar(`${prefix}-top`, `${nextInset.top}px`)
  setCssVar(`${prefix}-bottom`, `${nextInset.bottom}px`)
  setCssVar(`${prefix}-left`, `${nextInset.left}px`)
  setCssVar(`${prefix}-right`, `${nextInset.right}px`)
}

function syncViewportCssVars(tg: TelegramWebApp) {
  const stableHeight = tg.viewportStableHeight || tg.viewportHeight || readViewportHeight()

  if (stableHeight > 0) {
    setCssVar('--app-height', `${stableHeight}px`)
  }

  syncInsetVars('--tg-safe-area', tg.safeAreaInset)
  syncInsetVars('--tg-content-safe-area', tg.contentSafeAreaInset)
}

function scheduleViewportSync(tg: TelegramWebApp) {
  VIEWPORT_RETRY_DELAYS_MS.forEach((delay) => {
    window.setTimeout(() => syncViewportCssVars(tg), delay)
  })
}

const initialViewportHeight = readViewportHeight()
if (initialViewportHeight > 0) {
  setCssVar('--app-height', `${initialViewportHeight}px`)
}
setCssVar('--tg-theme-bg-color', TELEGRAM_BG)
setCssVar('--tg-theme-secondary-bg-color', TELEGRAM_BG)
setCssVar('--tg-theme-header-bg-color', TELEGRAM_BG)

try {
  const tg = getTelegramWebApp()
  if (!tg) {
    throw new Error('Telegram WebApp is unavailable')
  }

  const syncViewport = () => syncViewportCssVars(tg)
  const handleFullscreenChanged = () => {
    syncViewport()
    scheduleViewportSync(tg)
  }
  const handleFullscreenFailed = (_params: EventParams['fullscreenFailed']) => {
    tg.expand()
    syncViewport()
  }

  syncViewport()
  tg.ready()
  if (typeof tg.disableVerticalSwipes === 'function') {
    tg.disableVerticalSwipes()
  }
  tg.setHeaderColor(TELEGRAM_BG)
  tg.setBackgroundColor(TELEGRAM_BG)
  if (typeof tg.onEvent === 'function') {
    tg.onEvent('viewportChanged', syncViewport)
    tg.onEvent('safeAreaChanged', syncViewport)
    tg.onEvent('contentSafeAreaChanged', syncViewport)
    tg.onEvent('fullscreenChanged', handleFullscreenChanged)
    tg.onEvent('fullscreenFailed', handleFullscreenFailed)
  }
  tg.expand()

  if (tg.isVersionAtLeast('8.0')) {
    tg.requestFullscreen()
    scheduleViewportSync(tg)
  }
} catch {
  // Ignore non-Telegram contexts.
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element not found')
}

document.addEventListener('pointerdown', (event) => {
  if (!(event.target instanceof HTMLElement)) {
    return
  }

  if (
    event.target.closest('button') ||
    event.target.closest('[role="button"]') ||
    event.target.closest('a')
  ) {
    try {
      getTelegramWebApp()?.HapticFeedback?.impactOccurred('light')
    } catch {
      // Ignore unsupported environments.
    }
  }
}, { passive: true })

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
