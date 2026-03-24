import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { EventParams, SafeAreaInset, WebApp as TelegramWebApp } from '@twa-dev/types'
import WebApp from '@twa-dev/sdk'
import App from './App'
import './styles/global.css'

const TELEGRAM_BG = '#0a0a0f'
const VIEWPORT_RETRY_DELAYS_MS = [350, 500, 1000] as const

function setCssVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value)
}

function syncInsetVars(prefix: '--tg-safe-area' | '--tg-content-safe-area', inset: SafeAreaInset) {
  setCssVar(`${prefix}-top`, `${inset.top}px`)
  setCssVar(`${prefix}-bottom`, `${inset.bottom}px`)
  setCssVar(`${prefix}-left`, `${inset.left}px`)
  setCssVar(`${prefix}-right`, `${inset.right}px`)
}

function syncViewportCssVars(tg: TelegramWebApp) {
  const stableHeight = tg.viewportStableHeight || tg.viewportHeight || window.innerHeight

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

setCssVar('--app-height', `${window.innerHeight}px`)
setCssVar('--tg-theme-bg-color', TELEGRAM_BG)
setCssVar('--tg-theme-secondary-bg-color', TELEGRAM_BG)
setCssVar('--tg-theme-header-bg-color', TELEGRAM_BG)

try {
  const tg = WebApp
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
  tg.disableVerticalSwipes()
  tg.setHeaderColor(TELEGRAM_BG)
  tg.setBackgroundColor(TELEGRAM_BG)
  tg.onEvent('viewportChanged', syncViewport)
  tg.onEvent('safeAreaChanged', syncViewport)
  tg.onEvent('contentSafeAreaChanged', syncViewport)
  tg.onEvent('fullscreenChanged', handleFullscreenChanged)
  tg.onEvent('fullscreenFailed', handleFullscreenFailed)
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
      WebApp.HapticFeedback.impactOccurred('light')
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
